import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

// ------------------ Toggle Registration Form ------------------
document.getElementById("registerBtn").addEventListener("click", () => {
  document.getElementById("registrationForm").style.display = "block";
});

// ------------------ Submit Registration ------------------
document.getElementById("submitRegistration").addEventListener("click", async () => {
  const name = document.getElementById("regName").value;
  const cls = document.getElementById("regClass").value;
  const roll = document.getElementById("regRoll").value;
  const whatsapp = document.getElementById("regWhatsapp").value;
  const pass = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirmPassword").value;

  if(pass !== confirm){
    alert("Passwords do not match!");
    return;
  }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  // Save to Firebase Realtime DB
  await set(ref(db, `registrations/${studentId}`), {
    name, class: cls, roll, whatsapp, password: pass, approved:false
  });

  alert(`Registration successful! Your Student ID: ${studentId}`);
  document.getElementById("registrationForm").reset();
});

// ------------------ Login ------------------
document.getElementById("loginBtn").addEventListener("click", async () => {
  const userId = document.getElementById("userId").value;
  const password = document.getElementById("password").value;

  // Admin login
  if(userId === "theacademiccare2025@gmail.com"){
    try {
      await signInWithEmailAndPassword(auth, userId, password);
      window.location.href="adminPanel.html";
    } catch(e){
      alert("Admin login failed: " + e.message);
    }
    return;
  }

  // Student login
  const snapshot = await get(ref(db, `registrations/${userId}`));
  if(snapshot.exists()){
    const student = snapshot.val();
    if(!student.approved){
      alert("Your registration is not approved yet.");
      return;
    }
    if(student.password !== password){
      alert("Incorrect password!");
      return;
    }
    localStorage.setItem("studentId", userId);
    window.location.href="studentPanel.html";
  } else {
    alert("Student ID not found!");
  }
});
