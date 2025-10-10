// script.js
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

// Student Registration
document.getElementById("registrationForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const studentClass = document.getElementById("class").value;
  const roll = document.getElementById("roll").value;
  const whatsapp = document.getElementById("whatsapp").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

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
  } catch(error){
    console.error(error);
    alert("Error: " + error.message);
  }
});

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("studentId").value;
  const password = document.getElementById("password").value;

  let email;
  if(userId === "admin"){
    email = "theacademiccare2025@gmail.com";  // Admin login
  } else {
    email = `${userId}@student.theacademiccare.com`;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    if(userId === "admin"){
      localStorage.setItem("adminLoggedIn", "true");
      window.location.href = "adminPanel.html";
      return;
    }

    const snapshot = await get(ref(db, `registrations/${userId}`));
    if(snapshot.exists() && snapshot.val().approved){
      localStorage.setItem("studentId", userId);
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

// Logout (used in both panels)
export async function logout(){
  await signOut(auth);
  localStorage.clear();
  window.location.href = "index.html";
}
