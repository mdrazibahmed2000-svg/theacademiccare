import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Elements
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const backLoginBtn = document.getElementById("backLoginBtn");
const messageDiv = document.getElementById("message");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

// Show registration form
showRegisterBtn.addEventListener("click", ()=>{
  loginSection.style.display = "none";
  registerSection.style.display = "block";
});

// Back to login
backLoginBtn.addEventListener("click", ()=>{
  registerSection.style.display = "none";
  loginSection.style.display = "block";
});

// ---------------- LOGIN ----------------
loginBtn.addEventListener("click", ()=>{
  const userId = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value;

  if(!userId || !password){ messageDiv.innerText="Enter all fields"; return; }

  if(userId.includes("@")) {
    // Admin login by email
    signInWithEmailAndPassword(auth,userId,password)
      .then((userCredential)=>{
        window.location.href="adminPanel.html"; // Admin dashboard
      })
      .catch(err=>{ messageDiv.innerText=err.message; });
  } else {
    // Student login by studentId
    // Password check will be custom via Realtime DB
    const studentRef = ref(db, `students/${userId}`);
    studentRef.get().then(snapshot=>{
      if(snapshot.exists()){
        const s = snapshot.val();
        if(s.password===password){
          window.location.href=`studentPanel.html?studentId=${userId}`;
        } else {
          messageDiv.innerText="Invalid password";
        }
      } else {
        messageDiv.innerText="Student ID not found";
      }
    });
  }
});

// ---------------- REGISTRATION ----------------
registerBtn.addEventListener("click", ()=>{
  const name = document.getElementById("regName").value.trim();
  const cls = document.getElementById("regClass").value.trim();
  const roll = document.getElementById("regRoll").value.trim();
  const whatsapp = document.getElementById("regWhatsapp").value.trim();
  const pwd = document.getElementById("regPassword").value;
  const cpwd = document.getElementById("regConfirmPassword").value;

  if(!name||!cls||!roll||!whatsapp||!pwd||!cpwd){ messageDiv.innerText="Fill all fields"; return; }
  if(pwd!==cpwd){ messageDiv.innerText="Passwords don't match"; return; }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  const studentData = {
    studentId, name, class:cls, roll, whatsapp, password:pwd, status:"pending"
  };

  set(ref(db, `students/${studentId}`), studentData)
    .then(()=>{
      messageDiv.innerText=`Registration submitted! Your Student ID: ${studentId}`;
      registerSection.style.display="none";
      loginSection.style.display="block";
    })
    .catch(err=>{ messageDiv.innerText=err.message; });
});
