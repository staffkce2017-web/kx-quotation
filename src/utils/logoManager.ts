import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LOGO_STORAGE_KEY = 'kx_app_custom_logo';
const LOGO_STYLE_KEY = 'kx_app_logo_style';

export type KXLogoStyle = 'orange_modern' | 'monochrome_dark' | 'gradient_tech' | 'custom_image';

/**
 * Compresses and scales an image file to a lightweight Data URL (PNG)
 * Ensures high quality for Retina/PDF while preventing LocalStorage QuotaExceededError.
 */
export async function compressImageFile(file: File, maxWidth = 800, maxHeight = 300): Promise<string> {
  // If SVG file and small enough, use directly
  if (file.type === 'image/svg+xml' && file.size < 250 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG for transparency
        const compressed = canvas.toDataURL('image/png', 0.95);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getStoredLogo(): string | null {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

export function getStoredLogoStyle(): KXLogoStyle {
  try {
    const saved = localStorage.getItem(LOGO_STYLE_KEY);
    if (saved && ['orange_modern', 'monochrome_dark', 'gradient_tech', 'custom_image'].includes(saved)) {
      return saved as KXLogoStyle;
    }
  } catch (e) {}
  return 'orange_modern';
}

export function setStoredLogo(url: string | null, style: KXLogoStyle = 'custom_image') {
  try {
    if (url) {
      localStorage.setItem(LOGO_STORAGE_KEY, url);
      localStorage.setItem(LOGO_STYLE_KEY, 'custom_image');
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
      localStorage.setItem(LOGO_STYLE_KEY, style);
    }
    window.dispatchEvent(new Event('kx_logo_changed'));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }

  // Also sync to Cloud Firestore so all devices see the company logo
  try {
    const docRef = doc(db, 'settings', 'brand');
    setDoc(
      docRef,
      {
        logoUrl: url,
        logoStyle: url ? 'custom_image' : style,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Firestore logo sync notice:', err);
    });
  } catch (e) {}
}

export function useAppLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(getStoredLogo);
  const [logoStyle, setLogoStyle] = useState<KXLogoStyle>(getStoredLogoStyle);

  useEffect(() => {
    // 1. Local event listener
    const handleUpdate = () => {
      setLogoUrl(getStoredLogo());
      setLogoStyle(getStoredLogoStyle());
    };

    window.addEventListener('kx_logo_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // 2. Real-time Cloud Firestore sync listener for brand logo
    let unsubscribeFirestore = () => {};
    try {
      const docRef = doc(db, 'settings', 'brand');
      unsubscribeFirestore = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.logoUrl !== undefined) {
              setLogoUrl(data.logoUrl || null);
              try {
                if (data.logoUrl) {
                  localStorage.setItem(LOGO_STORAGE_KEY, data.logoUrl);
                } else {
                  localStorage.removeItem(LOGO_STORAGE_KEY);
                }
              } catch (e) {}
            }
            if (data.logoStyle) {
              setLogoStyle(data.logoStyle);
              try {
                localStorage.setItem(LOGO_STYLE_KEY, data.logoStyle);
              } catch (e) {}
            }
          }
        },
        (err) => {
          console.warn('Firestore brand listener notice:', err);
        }
      );
    } catch (e) {}

    return () => {
      window.removeEventListener('kx_logo_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      unsubscribeFirestore();
    };
  }, []);

  return {
    logoUrl,
    logoStyle,
    updateLogo: (url: string | null, style?: KXLogoStyle) => {
      setStoredLogo(url, style);
      setLogoUrl(url);
      if (style) setLogoStyle(style);
    },
  };
}
