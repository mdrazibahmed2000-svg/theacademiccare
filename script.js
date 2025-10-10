import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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

// Elements
const loginBtn = document.getElementById("loginBtn");
const showRegBtn = document.getElementById("showRegBtn");
const submitRegBtn = document.getElementById("submitRegBtn");
const cancelRegBtn = document.getElementById("cancelRegBtn");
const message = document.getElementById("message");

const loginSection = document.getElementById("loginSection");
const registrationSection = document.getElementById("registrationSection");

// Show Registration Form
showRegBtn.addEventListener("click", ()=>{
  loginSection.style.display="none";
  registrationSection.style.display="block";
});

// Cancel Registration
cancelRegBtn.addEventListener("click", ()=>{
  registrationSection.style.display="none";
  loginSection.style.display="block";
});

// Login
loginBtn.addEventListener("click", ()=>{
  const userId = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value.trim();

  if(userId === "" || password === "") { message.textContent="Fill all fields"; return; }

  // Check if admin
  if(userId === "theacademiccare2025@gmail.com"){
    signInWithEmailAndPassword(auth, userId, password)
      .then(()=> window.location.href="adminPanel.html")
      .catch(err=> message.textContent = "Invalid admin credentials");
  } else {
    // Student login
    const studentRef = ref(db, `students/${userId}`);
    onValue(studentRef, snap=>{
      if(snap.exists()){
        const s = snap.val();
        if(s.status==="approved" && s.password===password){
          window.location.href=`studentPanel.html?studentId=${userId}`;
        } else message.textContent="Invalid credentials or not approved yet";
      } else message.textContent="Student ID not found";
    },{onlyOnce:true});
  }
});

// Registration
submitRegBtn.addEventListener("click", ()=>{
  const name = document.getElementById("name").value.trim();
  const cls = document.getElementById("class").value.trim();
  const roll = document.getElementById("roll").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if(!name || !cls || !roll || !whatsapp || !password || !confirmPassword){
    message.textContent="Fill all fields";
    return;
  }
  if(password!==confirmPassword){
    message.textContent="Passwords do not match";
    return;
  }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  const studentRef = ref(db, `students/${studentId}`);
  set(studentRef,{
    studentId,
    name,
    class: cls,
    roll,
    whatsapp,
    password,
    status:"pending"
  }).then(()=>{
    message.textContent=`Registration submitted. Your Student ID: ${studentId}`;
    registrationSection.style.display="none";
    loginSection.style.display="block";
  }).catch(err=> message.textContent="Error submitting registration");
});
