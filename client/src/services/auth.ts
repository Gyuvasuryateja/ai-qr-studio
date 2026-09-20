export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const STORAGE_KEY = 'custom_qr_auth_user';
const USERS_DB_KEY = 'custom_qr_registered_users';

interface RegisteredUser extends User {
  passwordHash: string; // client-side simulation or direct
}

function getStoredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: RegisteredUser[]) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export const authService = {
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  signUp(name: string, email: string, password: string):User {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail || !password || !cleanName) {
      throw new Error('Please fill in all fields.');
    }

    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please Sign In.');
    }

    const newUser: RegisteredUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      name: cleanName,
      email: cleanEmail,
      passwordHash: btoa(password), // simple obfuscation for local client auth
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveStoredUsers(users);

    const sessionUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  signIn(email: string, password: string): User {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter your email and password.');
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('No account found with this email. Please Sign Up first.');
    }

    if (user.passwordHash !== btoa(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    const sessionUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  resetPassword(email: string, newPassword: string): void {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your account email.');
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    const users = getStoredUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (index === -1) {
      throw new Error('No registered account found with this email address.');
    }

    users[index].passwordHash = btoa(newPassword);
    saveStoredUsers(users);
  },

  signOut(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
