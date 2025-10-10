// -----------------------------
// 🔹 Firebase Configuration
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


// -----------------------------
// 🔹 LOGIN + REGISTRATION Toggle
// -----------------------------
const loginContainer = document.querySelector('.login-container');
const registerContainer = document.querySelector('.register-container');

document.getElementById('showRegisterBtn').addEventListener('click', () => {
  loginContainer.style.display = 'none';
  registerContainer.style.display = 'block';
});

document.getElementById('backToLoginBtn').addEventListener('click', () => {
  registerContainer.style.display = 'none';
  loginContainer.style.display = 'block';
});


// -----------------------------
// 🔹 STUDENT REGISTRATION
// -----------------------------
document.getElementById("submitRegistration").addEventListener("click", async () => {
  const name = document.getElementById("regName").value.trim();
  const studentClass = document.getElementById("regClass").value.trim();
  const roll = document.getElementById("regRoll").value.trim();
  const whatsapp = document.getElementById("regWhatsapp").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

  if (!name || !studentClass || !roll || !whatsapp || !password || !confirmPassword) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  if (password !== confirmPassword) {
    alert("⚠️ Passwords do not match!");
    return;
  }

  // Generate unique Student ID (Format: S[Year][Class][Roll])
  const year = new Date().getFullYear();
  const studentId = `S${year}${studentClass}${roll}`;

  const registrationData = {
    name: name,
    class: studentClass,
    roll: roll,
    whatsapp: whatsapp,
    password: password,
    studentId: studentId,
    approved: false,
    date: new Date().toLocaleDateString()
  };

  try {
    await set(ref(db, "registrations/" + studentId), registrationData);
    alert(`✅ Registration successful!\nYour Student ID: ${studentId}\nPlease wait for admin approval.`);
    
    // Clear form fields
    document.getElementById("regName").value = "";
    document.getElementById("regClass").value = "";
    document.getElementById("regRoll").value = "";
    document.getElementById("regWhatsapp").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("regConfirmPassword").value = "";

    // Go back to Login
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';

  } catch (error) {
    console.error(error);
    alert("❌ Error submitting registration: " + error.message);
  }
});


// -----------------------------
// 🔹 LOGIN SYSTEM (Admin + Student)
// -----------------------------
document.getElementById("loginBtn").addEventListener("click", async () => {
  const userInput = document.getElementById("userInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!userInput || !password) {
    alert("⚠️ Please enter both ID/email and password.");
    return;
  }

  // 🔸 Admin Login (Firebase Auth)
  if (userInput === "theacademiccare2025@gmail.com") {
    try {
      await signInWithEmailAndPassword(auth, userInput, password);
      alert("✅ Admin login successful!");
      window.location.href = "admin.html"; // redirect
    } catch (error) {
      alert("❌ Admin login failed: " + error.message);
    }
  } 
  
  // 🔸 Student Login (Realtime Database)
  else {
    try {
      const studentRef = ref(db, "registrations/" + userInput);
      const snapshot = await get(studentRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.password === password) {
          if (data.approved) {
            alert(`✅ Welcome ${data.name}!`);
            localStorage.setItem("studentId", userInput);
            window.location.href = "student.html";
          } else {
            alert("⏳ Your registration is pending admin approval.");
          }
        } else {
          alert("❌ Incorrect password!");
        }
      } else {
        alert("❌ Student ID not found!");
      }
    } catch (error) {
      alert("❌ Login error: " + error.message);
    }
  }
});
