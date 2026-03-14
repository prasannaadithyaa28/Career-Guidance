import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWV9kMhNypfYVr0-rLczunPCKKypDrpks",
  authDomain: "career-f240c.firebaseapp.com",
  projectId: "career-f240c",
  storageBucket: "career-f240c.firebasestorage.app",
  messagingSenderId: "1019909399721",
  appId: "1:1019909399721:web:4f98f73dd408ad0d2635b8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => console.warn("Auth persistence error:", err));

// getAnalytics can throw in localhost / restricted environments — guard it
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics not available:", e.message);
}

export { auth, analytics };
