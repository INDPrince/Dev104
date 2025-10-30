import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC6kNDRi7fC2e3i2AqVTT_Wph-ehL5dmYA",
  authDomain: "quiz-11-9dca6.firebaseapp.com",
  projectId: "quiz-11-9dca6",
  storageBucket: "quiz-11-9dca6.firebasestorage.app",
  messagingSenderId: "408282991747",
  appId: "1:408282991747:web:892fdfc1989a85be921fb6",
  databaseURL: "https://quiz-11-9dca6-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Pre-connect disabled to prevent errors in testing/preview environments
// Firebase will connect automatically when needed

export { app, database };
