import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB8PR6m1CjfxX4JH4BEQXJcs2EjSnDssbE",

  authDomain: "cksc-merchandis.firebaseapp.com",

  projectId: "cksc-merchandis",

  storageBucket: "cksc-merchandis.firebasestorage.app",

  messagingSenderId: "294251224185",

  appId: "1:294251224185:web:5b1904f929e6ced3eb08a8",

  measurementId: "G-S1L40CTMG8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
