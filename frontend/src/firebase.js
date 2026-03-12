import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbhCLqU8PkiHEW75Ugh9VoWocMfK_H3Ro",
  authDomain: "career-b1341.firebaseapp.com",
  projectId: "career-b1341",
  storageBucket: "career-b1341.firebasestorage.app",
  messagingSenderId: "180152106042",
  appId: "1:180152106042:web:2dd020873762661de1c903",
  measurementId: "G-T0C3DCLJW7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// getAnalytics can throw in localhost / restricted environments — guard it
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics not available:", e.message);
}

export { auth, analytics };
