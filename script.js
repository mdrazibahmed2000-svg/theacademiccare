import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

document.getElementById("showRegisterBtn").addEventListener("click", () => {
  loginSection.style.display = "none";
  registerSection.style.display = "block";
});

// ---------------- Register ----------------
document.getElementById("registerBtn").addEventListener("click", () => {
  const name = document.getElementById("regName").value;
  const studentClass = document.getElementById("regClass").value;
  const roll = document.getElementById("regRoll").value;
  const whatsapp = document.getElementById("regWhatsapp").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if (password !== confirmPassword) { alert("Passwords don't match"); return; }

  const year = new Date().getFullYear();
  const studentId = `S${year}${studentClass}${roll}`;

  set(ref(db, `students/${studentId}`), {
    name,
    class: studentClass,
    roll,
    whatsapp,
    password,
    studentId,
    status: "pending"
  }).then(()=>alert(`Registration submitted! Your ID: ${studentId}`));
});

// ---------------- Login ----------------
document.getElementById("loginBtn").addEventListener("click", () => {
  const userId = document.getElementById("userId").value;
  const password = document.getElementById("password").value;

  // Admin login
  if(userId === "theacademiccare2025@gmail.com"){
    signInWithEmailAndPassword(auth, userId, password)
      .then(()=> window.location.href="adminPanel.html")
      .catch(err=> alert(err.message));
  } else {
    // Student login
    const studentRef = ref(db, `students/${userId}`);
    onValue(studentRef, (snap)=>{
      if(snap.exists() && snap.val().status === "approved" && snap.val().password === password){
        window.location.href="studentPanel.html?studentId="+userId;
      } else alert("Login failed or not approved");
    }, {onlyOnce:true});
  }
});
