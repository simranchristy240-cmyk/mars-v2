import * as admin from 'firebase-admin';
import { ENV } from './env';

let firebaseInitialized = false;

if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY,
      }),
    });
    firebaseInitialized = true;
    console.log('[Firebase] Admin SDK initialized successfully');
  } catch (err) {
    console.warn('[Firebase] Warning: Failed to initialize Firebase Admin SDK:', err);
  }
} else {
  console.log('[Firebase] Running in Mock/Dev mode (No Firebase private key provided)');
}

export const isFirebaseInitialized = () => firebaseInitialized;
export const verifyFirebaseToken = async (idToken: string) => {
  if (firebaseInitialized) {
    return await admin.auth().verifyIdToken(idToken);
  }
  // Mock mode for local dev: everything after "mock_" is the Firebase UID
  // e.g. mock_demo_student_uid → demo_student_uid
  if (idToken.startsWith('mock_')) {
    const uid = idToken.slice('mock_'.length) || 'demo_student_uid';
    const email =
      uid.includes('admin')
        ? 'admin@mars.edu'
        : uid.includes('new')
          ? 'newstudent@mars.edu'
          : 'student@mars.edu';
    return {
      uid,
      email,
      phone_number: uid.includes('admin') ? undefined : '+919876543210',
    };
  }
  throw new Error('Invalid authentication token');
};
