import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfJmeY6xvXxMHK_-dXbb27604qd-Tcwa8",
  authDomain: "plasencia-handball-2026.firebaseapp.com",
  projectId: "plasencia-handball-2026",
  storageBucket: "plasencia-handball-2026.firebasestorage.app",
  messagingSenderId: "789132633460",
  appId: "1:789132633460:web:a3147da41ed8760b34b821"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
