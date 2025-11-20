
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBxWflFiLYbbgBOf0Z9DPh3brMeuQ5xfXE",
  authDomain: "project-5573148270857458513.firebaseapp.com",
  projectId: "project-5573148270857458513",
  storageBucket: "project-5573148270857458513.firebasestorage.app",
  messagingSenderId: "60366855199",
  appId: "1:60366855199:web:cfe3b6ba6611b2ab09892a",
  measurementId: "G-SJ4HH8SSE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
