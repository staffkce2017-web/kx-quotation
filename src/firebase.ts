import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4ryyYjdBaHkb8t0VJQzPikNTChbW4bvE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kx-quotation-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kx-quotation-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kx-quotation-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "253700520726",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:253700520726:web:08318d8d0f1ab351c86e37",
  measurementId: "G-DK59Y8MTYP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(app);

// ทดสอบการเชื่อมต่อ Firestore
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client appears offline')) {
      console.warn('Firebase client appears offline.');
    }
  }
})();

export default app;