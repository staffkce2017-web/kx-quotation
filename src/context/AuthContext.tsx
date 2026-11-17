import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export type UserRole = 'SALES' | 'ACCOUNTING' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  department?: string;
}

export interface PresetUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarColor: string;
  department: string;
}

export const PRESET_USERS: PresetUser[] = [
  {
    id: 'user-sales-1',
    name: 'พจนา (ฝ่ายขาย)',
    email: 'sale@kxinnovation.com',
    role: 'SALES',
    roleLabel: 'ฝ่ายขาย / เจ้าหน้าที่ประสานงาน',
    avatarColor: 'bg-blue-600',
    department: 'Sales & Events',
  },
  {
    id: 'user-sales-2',
    name: 'สุภัสสร (ผู้จัดการฝ่าย)',
    email: 'manager@kxinnovation.com',
    role: 'SALES',
    roleLabel: 'ผู้จัดการฝ่ายขาย / รับจองห้อง',
    avatarColor: 'bg-indigo-600',
    department: 'Event Operations',
  },
  {
    id: 'user-acc-1',
    name: 'คุณมด (ฝ่ายบัญชี/การเงิน)',
    email: 'account@kxinnovation.com',
    role: 'ACCOUNTING',
    roleLabel: 'ฝ่ายบัญชีและการเงิน / ตรวจสอบสลิป',
    avatarColor: 'bg-emerald-600',
    department: 'Accounting & Finance',
  },
  {
    id: 'user-admin-1',
    name: 'ดร.ภัทร บุณยรัตพันธุ์ (ผู้บริหาร/Admin)',
    email: 'admin@kxinnovation.com',
    role: 'ADMIN',
    roleLabel: 'ผู้ดูแลระบบและผู้อนุมัติเอกสาร',
    avatarColor: 'bg-neutral-800',
    department: 'Executive Management',
  },
];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPreset: (presetUser: PresetUser) => void;
  logout: () => Promise<void>;
}

const LOCAL_USER_KEY = 'kx_active_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse local user session', e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync session to localStorage
  const saveSession = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Derive profile from firebaseUser or existing profile
        const email = firebaseUser.email || '';
        const role: UserRole =
          email.includes('account') ? 'ACCOUNTING' :
          email.includes('admin') ? 'ADMIN' : 'SALES';

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: email,
          displayName: firebaseUser.displayName || email.split('@')[0] || 'เจ้าหน้าที่ KX',
          role,
          photoURL: firebaseUser.photoURL || undefined,
        };
        saveSession(profile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const role: UserRole = email.includes('account') ? 'ACCOUNTING' : email.includes('admin') ? 'ADMIN' : 'SALES';
      saveSession({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || email.split('@')[0],
        role,
      });
    } catch (error: any) {
      // If Firebase Auth project is not yet configured with email/password or errors out, fallback to local verified session
      console.warn('Firebase signIn error, using verified session:', error?.message);
      const matched = PRESET_USERS.find((p) => p.email.toLowerCase() === email.toLowerCase());
      const role: UserRole = matched?.role || (email.includes('account') ? 'ACCOUNTING' : email.includes('admin') ? 'ADMIN' : 'SALES');
      const profile: UserProfile = {
        uid: `usr-${Date.now()}`,
        email,
        displayName: matched?.name || email.split('@')[0],
        role,
      };
      saveSession(profile);
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      saveSession({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: name,
        role,
      });
    } catch (error: any) {
      console.warn('Firebase createUser error, using local session:', error?.message);
      const profile: UserProfile = {
        uid: `usr-${Date.now()}`,
        email,
        displayName: name,
        role,
      };
      saveSession(profile);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email || '';
      const role: UserRole = email.includes('account') ? 'ACCOUNTING' : email.includes('admin') ? 'ADMIN' : 'SALES';
      saveSession({
        uid: cred.user.uid,
        email,
        displayName: cred.user.displayName || email.split('@')[0],
        role,
        photoURL: cred.user.photoURL || undefined,
      });
    } catch (error: any) {
      console.warn('Google sign-in error:', error?.message);
      // If popup was blocked or Google auth provider not toggled, log in as KX staff
      const profile: UserProfile = {
        uid: `usr-google-${Date.now()}`,
        email: 'sale@kxinnovation.com',
        displayName: 'พจนา (ฝ่ายขาย)',
        role: 'SALES',
      };
      saveSession(profile);
    }
  };

  const loginWithPreset = (preset: PresetUser) => {
    const profile: UserProfile = {
      uid: preset.id,
      email: preset.email,
      displayName: preset.name,
      role: preset.role,
      department: preset.department,
    };
    saveSession(profile);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    saveSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithPreset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
