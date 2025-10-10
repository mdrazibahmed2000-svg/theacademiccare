import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

window.addEventListener("DOMContentLoaded", () => {

  // Toggle registration form
  document.getElementById("showRegistration").addEventListener("click", () => {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registrationForm").style.display = "block";
  });

  // Registration
  document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const studentClass = document.getElementById("regClass").value.trim();
    const roll = document.getElementById("regRoll").value.trim();
    const whatsapp = document.getElementById("regWhatsApp").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

    if(password !== confirmPassword){
      alert("Passwords do not match!");
      return;
    }

    const year = new Date().getFullYear();
    const studentId = `S${year}${studentClass}${roll}`;
    const email = `${studentId}@student.theacademiccare.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await set(ref(db, `registrations/${studentId}`), {
        uid: uid,
        name: name,
        class: studentClass,
        roll: roll,
        whatsapp: whatsapp,
        approved: false
      });

      alert(`Registration submitted! Your student ID: ${studentId}`);
      document.getElementById("registrationForm").reset();
      document.getElementById("registrationForm").style.display = "none";
      document.getElementById("loginForm").style.display = "block";

    } catch(error){
      console.error(error);
      alert("Error: " + error.message);
    }
  });

  // Login
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = document.getElementById("loginUserId").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    let email;

    // Admin alias
    if(input.toLowerCase() === "admin"){
        email = "theacademiccare2025@gmail.com";
    } else if(input.includes("@")) {
        email = input; // admin enters email
    } else {
        email = `${input}@student.theacademiccare.com`; // student
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      if(email === "theacademiccare2025@gmail.com"){
        localStorage.setItem("adminLoggedIn", "true");
        window.location.href = "adminPanel.html";
        return;
      }

      const snapshot = await get(ref(db, `registrations/${input}`));
      if(snapshot.exists() && snapshot.val().approved){
        localStorage.setItem("studentId", input);
        window.location.href = "studentPanel.html";
      } else {
        alert("Your registration is not approved yet.");
        await signOut(auth);
      }

    } catch(error){
      console.error(error);
      alert("Login failed: " + error.message);
    }
  });

});
