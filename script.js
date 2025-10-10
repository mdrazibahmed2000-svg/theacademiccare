import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, set, child, get, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasedatabase.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const loginBtn = document.getElementById('loginBtn');
const showRegBtn = document.getElementById('showRegBtn');
const submitRegBtn = document.getElementById('submitRegBtn');

showRegBtn.addEventListener('click', () => {
  document.querySelector('.register-container').style.display = 'block';
});

loginBtn.addEventListener('click', async () => {
  const idEmail = document.getElementById('userIdEmail').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('message');
  msg.innerText = '';

  try {
    if (idEmail.includes('@')) {
      // Admin login
      const userCredential = await signInWithEmailAndPassword(auth, idEmail, password);
      const uid = userCredential.user.uid;
      // Check if user is admin in Realtime DB
      const snapshot = await get(ref(db, 'users/' + uid));
      if(snapshot.exists() && snapshot.val().isAdmin){
        window.location.href = 'adminPanel.html';
      } else {
        msg.innerText = 'Not authorized as admin';
      }
    } else {
      // Student login
      const snapshot = await get(ref(db, 'students/' + idEmail));
      if(snapshot.exists() && snapshot.val().approved){
        // Sign in anonymously to allow session
        const userCredential = await signInWithEmailAndPassword(auth, snapshot.val().email, password);
        window.location.href = 'studentPanel.html?studentId=' + idEmail;
      } else {
        msg.innerText = 'Student not approved or does not exist';
      }
    }
  } catch (error) {
    msg.innerText = error.message;
  }
});

submitRegBtn.addEventListener('click', async () => {
  const name = document.getElementById('regName').value;
  const cls = document.getElementById('regClass').value;
  const roll = document.getElementById('regRoll').value;
  const whatsapp = document.getElementById('regWhatsApp').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const msg = document.getElementById('message');
  msg.innerText = '';

  if(password !== confirm){
    msg.innerText = "Passwords don't match";
    return;
  }

  const studentId = 'S2025' + cls + roll;

  try {
    // Save student registration
    await set(ref(db, 'students/' + studentId), {
      name,
      class: cls,
      roll,
      whatsapp,
      password,
      approved: false,
      studentId
    });
    msg.innerText = 'Registration submitted! Your Student ID: ' + studentId;
    document.querySelector('.register-container').style.display = 'none';
  } catch(err){
    msg.innerText = err.message;
  }
});
