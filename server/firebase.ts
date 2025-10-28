import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

export function initializeFirebase() {
  if (getApps().length === 0) {
    // Initialize Firebase Admin
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse service account from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // For local development or if using default credentials
      app = initializeApp();
    }
    
    db = getFirestore(app);
  }
  
  return { app, db };
}

export function getDb(): Firestore {
  if (!db) {
    const initialized = initializeFirebase();
    db = initialized.db;
  }
  return db;
}
