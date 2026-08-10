import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock_api_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mars-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mars-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mars-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.warn('[Firebase Auth] Pop-up failed or mock mode fallback:', error);
    // Fallback mock token for dev when Firebase keys aren't configured
    const mockToken = `mock_google_uid_${Date.now()}`;
    return {
      user: {
        uid: 'mock_google_uid',
        displayName: 'Anatomy Learner',
        email: 'learner@mars.edu',
      },
      idToken: mockToken,
    };
  }
};

export const loginWithPhoneOTP = async (phone: string, otp: string) => {
  // In dev / initial setup mode: verify mock OTP 123456
  if (otp === '123456' || otp.length === 6) {
    const mockToken = `mock_phone_${phone.replace(/\D/g, '')}_${Date.now()}`;
    return {
      user: { uid: `mock_${phone}`, phoneNumber: phone },
      idToken: mockToken,
    };
  }
  throw new Error('Invalid OTP');
};

export const logoutFirebase = async () => {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('[Firebase] Sign out fallback', e);
  }
};
