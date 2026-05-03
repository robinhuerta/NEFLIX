import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Configuración de Firebase para tu proyecto COSMOS
// Obtén estos valores en: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyDsIJS6XnyxPU1epvS-gkYAhPSW_utsOF8",
  authDomain: "neflix-69c93.firebaseapp.com",
  projectId: "neflix-69c93",
  storageBucket: "neflix-69c93.firebasestorage.app",
  messagingSenderId: "273562223582",
  appId: "1:273562223582:web:c1f289d04bb446ced4534f",
  measurementId: "G-2ZDYYBWTQZ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
