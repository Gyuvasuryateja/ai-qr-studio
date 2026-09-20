import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { QRCodeRecord } from '../types';

const googleProvider = new GoogleAuthProvider();

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isExistingAccount?: boolean;
}

const STORAGE_KEY = 'custom_qr_auth_user';

type AuthListener = (user: User | null) => void;
const authListeners: AuthListener[] = [];

export function notifyAuthListeners(user: User | null) {
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Listen to Firebase Auth state
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const user: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        createdAt: fbUser.metadata.creationTime || new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      notifyAuthListeners(user);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      notifyAuthListeners(null);
    }
  });
}

export const authService = {
  subscribe(listener: AuthListener): () => void {
    authListeners.push(listener);
    // Call immediately with current cached user
    listener(this.getCurrentUser());
    return () => {
      const idx = authListeners.indexOf(listener);
      if (idx !== -1) authListeners.splice(idx, 1);
    };
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async signUp(name: string, email: string, password: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail || !password || !cleanName) {
      throw new Error('Please fill in all fields.');
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(credential.user, { displayName: cleanName });

      const sessionUser: User = {
        id: credential.user.uid,
        name: cleanName,
        email: cleanEmail,
        createdAt: new Date().toISOString()
      };

      // Store user record in Firestore
      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          id: credential.user.uid,
          name: cleanName,
          email: cleanEmail,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Firestore user profile sync error:', e);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please Sign In.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      if (err.code === 'auth/invalid-email') {
        throw new Error('Please provide a valid email address.');
      }
      throw new Error(err.message || 'Failed to sign up.');
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter your email and password.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const sessionUser: User = {
        id: credential.user.uid,
        name: credential.user.displayName || cleanEmail.split('@')[0] || 'User',
        email: cleanEmail,
        createdAt: credential.user.metadata.creationTime || new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      throw new Error(err.message || 'Failed to sign in.');
    }
  },

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your account email.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw new Error('No registered account found with this email.');
      }
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  },

  async continueWithGoogle(presetName?: string, presetPassword?: string): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      // Determine if this is an existing account
      let isExisting = false;
      let existingName: string | undefined;
      let originalCreatedAt = fbUser.metadata.creationTime || new Date().toISOString();

      // 1. Check if Firebase says this is not a new user
      if (additionalInfo && !additionalInfo.isNewUser) {
        isExisting = true;
      }

      // 2. Check Firestore for existing user record
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          isExisting = true;
          const data = userSnap.data();
          if (data?.name) existingName = data.name;
          if (data?.createdAt) originalCreatedAt = data.createdAt;
        } else if (fbUser.email) {
          // Double check by email in case uid changed or email query
          const usersCol = collection(db, 'users');
          const emailQuery = query(usersCol, where('email', '==', fbUser.email.toLowerCase()));
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            isExisting = true;
            const data = emailSnap.docs[0].data();
            if (data?.name) existingName = data.name;
            if (data?.createdAt) originalCreatedAt = data.createdAt;
          }
        }
      } catch (checkErr) {
        console.warn('Could not verify existing account in Firestore:', checkErr);
      }

      // STRICT RULE: One user, one Gmail, one account!
      // If the account already exists with this Gmail, NEVER overwrite their previous name or create a new profile.
      // Always restore their previously created account!
      const finalName = isExisting
        ? (existingName || fbUser.displayName || 'User')
        : (presetName?.trim() || fbUser.displayName || fbUser.email?.split('@')[0] || 'User');

      if (!isExisting && presetName?.trim() && (!fbUser.displayName || fbUser.displayName !== presetName.trim())) {
        await updateProfile(fbUser, { displayName: presetName.trim() }).catch(() => {});
      }

      const sessionUser: User = {
        id: fbUser.uid,
        name: finalName,
        email: fbUser.email || '',
        createdAt: originalCreatedAt,
        isExistingAccount: isExisting
      };

      // Store / sync user record in Firestore without overwriting original createdAt
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          id: fbUser.uid,
          name: finalName,
          email: fbUser.email || '',
          createdAt: originalCreatedAt,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore user profile sync error:', e);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      notifyAuthListeners(sessionUser);
      return sessionUser;
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in popup was closed before completing. Please try again.');
      }
      throw new Error(err.message || 'Failed to authenticate with Google.');
    }
  },

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Cloud Firestore & Storage database service for permanent QR persistence
 */
export const cloudStorageService = {
  // Upload base64 audio to Firebase Storage bucket and return permanent URL
  async uploadAudio(qrId: string, base64Audio: string): Promise<string> {
    if (!base64Audio.startsWith('data:')) return base64Audio;
    try {
      const audioRef = ref(storage, `audio/${qrId}_${Date.now()}.webm`);
      await uploadString(audioRef, base64Audio, 'data_url');
      return await getDownloadURL(audioRef);
    } catch (err) {
      console.warn('Storage upload fallback (storing direct data URL):', err);
      return base64Audio;
    }
  },

  // Upload base64 image to Firebase Storage bucket and return permanent URL
  async uploadImage(qrId: string, base64Image: string): Promise<string> {
    if (!base64Image.startsWith('data:')) return base64Image;
    try {
      const imgRef = ref(storage, `images/${qrId}_${Date.now()}.jpg`);
      await uploadString(imgRef, base64Image, 'data_url');
      return await getDownloadURL(imgRef);
    } catch (err) {
      console.warn('Image upload fallback:', err);
      return base64Image;
    }
  },

  // Save QR code permanently to Cloud Firestore
  async saveQRCode(record: Partial<QRCodeRecord>): Promise<QRCodeRecord> {
    if (!record.id) throw new Error('QR ID is required');

    let customAudio = record.content?.customAudio;
    if (customAudio && customAudio.startsWith('data:')) {
      customAudio = await this.uploadAudio(record.id, customAudio);
    }

    let generatedImage = record.content?.generatedImage;
    if (generatedImage && generatedImage.startsWith('data:')) {
      generatedImage = await this.uploadImage(record.id, generatedImage);
    }

    const defaultStyle: QRCodeRecord['style'] = {
      dotType: 'rounded',
      colorType: 'linear',
      singleColor: '#6366f1',
      gradientColor1: '#6366f1',
      gradientColor2: '#a855f7',
      gradientRotation: 45,
      bgColor: '#ffffff',
      cornerSquareType: 'extra-rounded',
      cornerSquareColor: '#4f46e5',
      cornerDotType: 'dot',
      cornerDotColor: '#ec4899',
      margin: 10,
      errorCorrectionLevel: 'Q'
    };

    const now = new Date();
    const expiresAtDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from creation
    const nowIso = now.toISOString();
    const expiresAtIso = record.stats?.expiresAt || expiresAtDate.toISOString();

    const fullRecord: QRCodeRecord = {
      id: record.id,
      userId: record.userId || 'anonymous',
      userEmail: record.userEmail,
      title: record.title || 'Custom QR',
      mode: record.mode || 'url',
      content: {
        raw: record.content?.raw || '',
        enhanced: record.content?.enhanced,
        customUrl: record.content?.customUrl,
        customAudio: customAudio,
        generatedImage: generatedImage
      },
      style: record.style || defaultStyle,
      stats: {
        views: record.stats?.views || 0,
        scans: record.stats?.scans || 0,
        reactions: record.stats?.reactions || {},
        createdAt: record.stats?.createdAt || nowIso,
        lastAccessedAt: record.stats?.lastAccessedAt || nowIso,
        expiresAt: expiresAtIso
      }
    };

    const docRef = doc(db, 'qrcodes', record.id);
    try {
      await setDoc(docRef, fullRecord, { merge: true });
    } catch (firestoreErr) {
      console.warn('Firestore setDoc failed (e.g. security rules), proceeding with record:', firestoreErr);
    }
    return fullRecord;
  },

  // Get single QR code from Cloud Firestore
  async getQRCode(id: string): Promise<QRCodeRecord | null> {
    try {
      const docRef = doc(db, 'qrcodes', id);
      const snapPromise = getDoc(docRef);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore getDoc timeout')), 2500)
      );
      const snap = await Promise.race([snapPromise, timeoutPromise]) as any;
      if (!snap || !snap.exists()) return null;
      return snap.data() as QRCodeRecord;
    } catch {
      return null;
    }
  },

  // Get all QR codes for a user from Cloud Firestore with local cache backup
  async getQRCodes(userId?: string, userEmail?: string): Promise<QRCodeRecord[]> {
    const recordsMap = new Map<string, QRCodeRecord>();
    const CACHE_KEY = `cached_qrs_${userId || 'anon'}`;

    // Load from local storage cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: QRCodeRecord[] = JSON.parse(cached);
        parsed.forEach(r => recordsMap.set(r.id, r));
      }
    } catch {}

    try {
      const qrsCollection = collection(db, 'qrcodes');

      // 1. Query by userId
      if (userId) {
        const userQ = query(qrsCollection, where('userId', '==', userId));
        const userSnap = await getDocs(userQ);
        userSnap.forEach(d => recordsMap.set(d.id, d.data() as QRCodeRecord));
      }

      // 2. Query by userEmail as secondary link
      if (userEmail) {
        const emailQ = query(qrsCollection, where('userEmail', '==', userEmail.toLowerCase()));
        const emailSnap = await getDocs(emailQ);
        emailSnap.forEach(d => recordsMap.set(d.id, d.data() as QRCodeRecord));
      }

      // If no user filter provided, get all
      if (!userId && !userEmail) {
        const allSnap = await getDocs(query(qrsCollection));
        allSnap.forEach(d => recordsMap.set(d.id, d.data() as QRCodeRecord));
      }
    } catch (err) {
      console.warn('Firestore getQRCodes fetch error:', err);
    }

    const records = Array.from(recordsMap.values()).sort((a, b) => 
      new Date(b.stats.createdAt).getTime() - new Date(a.stats.createdAt).getTime()
    );

    // Filter out only ones that have actually expired (> 30 days)
    const nowMs = Date.now();
    const activeRecords = records.filter(record => {
      if (!record.stats) return true;
      const createdMs = new Date(record.stats.createdAt).getTime();
      const expiresMs = record.stats.expiresAt 
        ? new Date(record.stats.expiresAt).getTime() 
        : (createdMs + 30 * 24 * 60 * 60 * 1000);
      return nowMs <= expiresMs; // Retain strictly for 30 days!
    });

    // Save back to persistent local cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(activeRecords));
    } catch {}

    return activeRecords;
  },

  // Increment view counter permanently
  async recordView(id: string): Promise<{ views: number }> {
    const docRef = doc(db, 'qrcodes', id);
    await updateDoc(docRef, {
      'stats.views': increment(1)
    });
    const snap = await getDoc(docRef);
    const data = snap.data() as QRCodeRecord;
    return { views: data?.stats?.views || 1 };
  },

  // Record emoji reaction permanently
  async recordReaction(id: string, emoji: string): Promise<{ reactions: Record<string, number> }> {
    const docRef = doc(db, 'qrcodes', id);
    await updateDoc(docRef, {
      [`stats.reactions.${emoji}`]: increment(1)
    });
    const snap = await getDoc(docRef);
    const data = snap.data() as QRCodeRecord;
    return { reactions: data?.stats?.reactions || {} };
  },

  // Delete QR Code permanently from Cloud Firestore
  async deleteQRCode(id: string): Promise<boolean> {
    const docRef = doc(db, 'qrcodes', id);
    await deleteDoc(docRef);
    return true;
  }
};
