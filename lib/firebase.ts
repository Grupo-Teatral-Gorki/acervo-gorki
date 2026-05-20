import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8QD31szOg1Pt-P-mQwyDsrcK3xoX9Mig",
  authDomain: "acervo-gorki.firebaseapp.com",
  projectId: "acervo-gorki",
  storageBucket: "acervo-gorki.firebasestorage.app",
  messagingSenderId: "617692033320",
  appId: "1:617692033320:web:e4919b84e1a7f3f450601d",
};

function getApp_() : FirebaseApp {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

const app = getApp_();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

function getSecondaryApp(): FirebaseApp {
  try {
    return getApp("secondary");
  } catch {
    return initializeApp(firebaseConfig, "secondary");
  }
}

export const secondaryAuth: Auth = getAuth(getSecondaryApp());
