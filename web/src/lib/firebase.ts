import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8eSSRj2UH2sU7kkyD3v2lBZWf83aJmUI",
  authDomain: "ibkbaas-franchise-dashboard.firebaseapp.com",
  projectId: "ibkbaas-franchise-dashboard",
  storageBucket: "ibkbaas-franchise-dashboard.firebasestorage.app",
  messagingSenderId: "1036729387301",
  appId: "1:1036729387301:web:509ebd1f61a87a235872cc",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
