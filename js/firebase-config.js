// Firebase configuration and initialization (modular v12.10.0)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG8Z-KdHL03S63lGA5CBb2UnABooq_6vU",
  authDomain: "barangay-ncd-monitoring.firebaseapp.com",
  projectId: "barangay-ncd-monitoring",
  storageBucket: "barangay-ncd-monitoring.firebasestorage.app",
  messagingSenderId: "764152715516",
  appId: "1:764152715516:web:0099b582f4a90c84e15f79",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export services for use in other modules
export const auth = getAuth(app);
export const db = getFirestore(app);

