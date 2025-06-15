import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYryHug28JMORnnDUHcTdC_Dq51ExeiYw",
  authDomain: "pede-fava.firebaseapp.com",
  projectId: "pede-fava",
  storageBucket: "pede-fava.firebasestorage.app",
  messagingSenderId: "1018012293208",
  appId: "1:1018012293208:web:49d382352e5604f071922d",
  measurementId: "G-JMSFXCW79D",
};

const app = initializeApp(firebaseConfig);
const db = firebase.database();

export { app, db };
