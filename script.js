import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasedatabase.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginBtn = document.getElementById("loginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const backLoginBtn = document.getElementById("backLogin");

const submitRegistration = document.getElementById("submitRegistration");

// ---------------- Form toggle ----------------
showRegisterBtn.addEventListener("click", () => {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

backLoginBtn.addEventListener("click", () => {
  registerForm.style.display = "none";
  loginForm.style.display = "block";
});

// ---------------- Login ----------------
loginBtn.addEventListener("click", () => {
  const userId = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value;

  if(userId.includes("@")) {
    // Admin login
    signInWithEmailAndPassword(auth, userId, password)
      .then(() => window.location.href="adminPanel.html")
      .catch(err => document.getElementById("loginError").innerText = err.message);
  } else {
    // Student login
    get(child(ref(db), `students/${userId}`)).then(snap => {
      if(snap.exists()){
        const student = snap.val();
        if(student.password === password && student.status === "approved"){
          window.location.href = `studentPanel.html?studentId=${userId}`;
        } else if(student.status !== "approved") {
          document.getElementById("loginError").innerText = "Your registration is not approved yet";
        } else {
          document.getElementById("loginError").innerText = "Password incorrect";
        }
      } else {
        document.getElementById("loginError").innerText = "Student ID not found";
      }
    });
  }
});

// ---------------- Registration ----------------
submitRegistration.addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const cls = document.getElementById("class").value.trim();
  const roll = document.getElementById("roll").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if(password !== confirmPassword){
    document.getElementById("registerError").innerText = "Passwords do not match";
    return;
  }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  set(ref(db, `students/${studentId}`), {
    name, class: cls, roll, whatsapp, password, studentId, status: "pending"
  }).then(()=>{
    document.getElementById("registerSuccess").innerText = `Registration submitted. Your ID: ${studentId}`;
    document.getElementById("registerError").innerText="";
  }).catch(err => {
    document.getElementById("registerError").innerText = err.message;
  });
});
