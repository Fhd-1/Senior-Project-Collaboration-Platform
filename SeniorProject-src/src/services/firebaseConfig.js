// Import only what you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// If you plan to use Firestore later:
// import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBu23uX-LYNJ0oK61o-2xI_2v_oylM4yvI",
  authDomain: "collab-platform-30b9b.firebaseapp.com",
  projectId: "collab-platform-30b9b",
  storageBucket: "collab-platform-30b9b.appspot.com", // fixed typo
  messagingSenderId: "342508034805",
  appId: "1:342508034805:web:047d1d139ce835ae6743bc",
  measurementId: "G-7WR5KTRPP8", // optional, not needed unless using analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
// export const db = getFirestore(app); // if using Firestore

export default app;
