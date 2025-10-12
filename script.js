// ------------------- IMPORT MODULES -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ------------------- INITIALIZE FIREBASE -------------------
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
const auth = getAuth(app);
const db = getDatabase(app);

// ------------------- ELEMENTS -------------------
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const forgotBox = document.getElementById("forgotBox");

// Toggle Boxes
document.getElementById("registrationBtn").addEventListener("click", () => {
  loginBox.style.display = "none";
  registerBox.style.display = "block";
});
document.getElementById("backToLoginBtn").addEventListener("click", () => {
  registerBox.style.display = "none";
  loginBox.style.display = "block";
});
document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
  loginBox.style.display = "none";
  forgotBox.style.display = "block";
});
document.getElementById("backToLoginBtn2").addEventListener("click", () => {
  forgotBox.style.display = "none";
  loginBox.style.display = "block";
});

// ------------------- STUDENT REGISTRATION -------------------
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const cls = document.getElementById("regClass").value.trim();
  const roll = document.getElementById("regRoll").value.trim();
  const whatsapp = document.getElementById("regWhatsapp").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  try {
    await set(ref(db, `Registrations/${studentId}`), {
      name,
      class: cls,
      roll,
      whatsapp,
      password,
      approved: false
    });
    alert(`Registration submitted! Your Student ID: ${studentId}`);
    registerBox.style.display = "none";
    loginBox.style.display = "block";
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// ------------------- LOGIN (ADMIN / STUDENT) -------------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (id.toLowerCase() === "admin") {
    // Admin login
    try {
      const userCredential = await signInWithEmailAndPassword(auth, "theacademiccare2025@gmail.com", password);
      const user = userCredential.user;

      if (user.uid === "xg4XNMsSJqbXMZ57qicrpgfM6Yn1") {
        window.location.href = "admin.html";
      } else {
        alert("You are not authorized as admin!");
        await signOut(auth);
      }
    } catch (err) {
      alert("Admin login failed: " + err.message);
    }
  } else {
    // Student login
    try {
      const snapshot = await get(child(ref(db), `Registrations/${id}`));
      if (!snapshot.exists()) return alert("Student ID not found!");

      const data = snapshot.val();
      if (!data.approved) return alert("Your registration is not approved yet!");
      if (data.password !== password) return alert("Incorrect password!");

      localStorage.setItem("studentId", id);
      window.location.href = "student.html";
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
});

// ------------------- FORGOT PASSWORD -------------------
document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const whatsapp = document.getElementById("forgotWhatsapp").value.trim();
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmNewPassword").value;

  if (newPass !== confirmPass) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const snapshot = await get(ref(db, "Registrations"));
    let found = false;

    snapshot.forEach(child => {
      const data = child.val();
      if (data.whatsapp === whatsapp) {
        found = true;
        update(ref(db, `Registrations/${child.key}`), { password: newPass });
        alert("Password reset successful!");
        forgotBox.style.display = "none";
        loginBox.style.display = "block";
      }
    });

    if (!found) alert("No student found with this WhatsApp number!");
  } catch (err) {
    alert("Error: " + err.message);
  }
});
