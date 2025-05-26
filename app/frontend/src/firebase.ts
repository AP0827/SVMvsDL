// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyD7mqh0bEmBGGk_6by-P8JoIk4mQGYSUHE",
  authDomain: "har-wearable.firebaseapp.com",
  projectId: "har-wearable",
  storageBucket: "har-wearable.firebasestorage.app",
  messagingSenderId: "835387413789",
  appId: "1:835387413789:web:2064d340c2dbad60463df4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
