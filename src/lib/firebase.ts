import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCg8Ovohow2Y3fbpMemPrA0UEjURR0Ndr0",
  authDomain: "migrateveo-5ea34.firebaseapp.com",
  databaseURL: "https://migrateveo-5ea34-default-rtdb.firebaseio.com",
  projectId: "migrateveo-5ea34",
  storageBucket: "migrateveo-5ea34.firebasestorage.app",
  messagingSenderId: "98096760725",
  appId: "1:98096760725:web:337ee13cfee53f14fd989c",
  measurementId: "G-QHKM4HBV1X"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);