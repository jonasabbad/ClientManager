import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web SDK configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiuVZzpqPMP-Q_76aGifJHKWknEU4Jr9o",
  authDomain: "customer-management-34f78.firebaseapp.com",
  projectId: "customer-management-34f78",
  storageBucket: "customer-management-34f78.firebasestorage.app",
  messagingSenderId: "207346074611",
  appId: "1:207346074611:web:1e860799194881ee594886"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore
export const db = getFirestore(app);

// Export auth helpers
export { auth, googleProvider };

// Export config for display in settings
export { firebaseConfig };
