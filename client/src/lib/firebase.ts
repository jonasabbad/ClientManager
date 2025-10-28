import { initializeApp } from 'firebase/app';
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

// Initialize Firestore
export const db = getFirestore(app);

// Export config for display in settings
export { firebaseConfig };
