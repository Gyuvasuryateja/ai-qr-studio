/**
 * Automatically resolve the public-facing URL for external phone camera & Google Lens scans.
 * Ensures local dev / container setups point to reachable public origins.
 */
// Auto-detected Wi-Fi LAN IP of this machine so phones on the same network can scan directly
export const LOCAL_LAN_IP = '10.52.7.203';

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return `http://${LOCAL_LAN_IP}:3000`;

  // 1. Check if user configured a custom public domain or host
  const customHost = localStorage.getItem('custom_qr_public_host')?.trim();
  if (customHost) {
    return customHost.replace(/\/+$/, '');
  }

  const origin = window.location.origin;

  // 2. If running on a public deployed host (e.g. your-app.vercel.app, render.com, etc.), use that origin directly!
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.')) {
    return origin;
  }

  // 3. If currently opened as localhost on PC, automatically replace localhost with this machine's Wi-Fi LAN IP
  // so external mobile phones and Google Lens can immediately connect and open the scan!
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${LOCAL_LAN_IP}:3000`;
  }

  return origin;
}

export function setCustomPublicHost(host: string): void {
  if (host && host.trim()) {
    localStorage.setItem('custom_qr_public_host', host.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('custom_qr_public_host');
  }
}

export function getRevealUrl(id: string): string {
  return `${getPublicBaseUrl()}/reveal/${id}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
}
