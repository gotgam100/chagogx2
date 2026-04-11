import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8oz3N0PUahG2c2l-mtaZAjGfyApCnO1g",
  authDomain: "chagokx2-53f7c.firebaseapp.com",
  projectId: "chagokx2-53f7c",
  storageBucket: "chagokx2-53f7c.firebasestorage.app",
  messagingSenderId: "842259733763",
  appId: "1:842259733763:web:1cd4d0ee83a811e1a1dd36",
  measurementId: "G-X12S1J09XD",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
