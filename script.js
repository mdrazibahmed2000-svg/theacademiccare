// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js";

// ------------------- FIREBASE CONFIG -------------------
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
const functions = getFunctions();

// ------------------- INDEX.HTML LOGIN / REGISTRATION -------------------
if (document.getElementById("loginBox")) {
  const loginBox = document.getElementById("loginBox");
  const registerBox = document.getElementById("registerBox");
  const forgotBox = document.getElementById("forgotBox");
  const otpSection = document.getElementById("otpSection");

  // Toggle forms
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

  // Student Registration
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const cls = document.getElementById("regClass").value.trim();
    const roll = document.getElementById("regRoll").value.trim();
    const whatsapp = document.getElementById("regWhatsapp").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) return alert("Passwords do not match!");

    const year = new Date().getFullYear();
    const studentId = `S${year}${cls}${roll}`;
    const email = `${studentId}@academiccare.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await set(ref(db, `Registrations/${uid}`), {
        studentId,
        name,
        class: cls,
        roll,
        whatsapp,
        approved: false,
        tuition: {}
      });

      alert(`Registration submitted! Your Student ID: ${studentId}`);
      registerBox.style.display = "none";
      loginBox.style.display = "block";

    } catch (err) {
      alert("Error during registration: " + err.message);
    }
  });

  // Login
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (id.toLowerCase() === "admin") {
      const adminEmail = "theacademiccare2025@gmail.com";
      try {
        await signInWithEmailAndPassword(auth, adminEmail, password);
        alert("Admin Sign In successful!");
        window.location.href = "admin.html";
      } catch (err) {
        alert("Admin login failed: " + err.message);
      }
      return;
    }

    try {
      const snapshot = await get(ref(db, "Registrations"));
      let uid = null;
      snapshot.forEach(child => {
        if (child.val().studentId === id) uid = child.key;
      });
      if (!uid) return alert("Student ID not found!");

      const email = `${id}@academiccare.com`;
      await signInWithEmailAndPassword(auth, email, password);

      const data = await get(ref(db, `Registrations/${uid}`));
      if (!data.val().approved) return alert("Your registration is not approved yet!");

      localStorage.setItem("studentUid", uid);
      alert("Student Sign In successful!");
      window.location.href = "student.html";

    } catch (err) {
      alert("Error during student login: " + err.message);
    }
  });

  // Forgot Password with WhatsApp OTP
  document.getElementById("forgotForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const whatsapp = document.getElementById("forgotWhatsapp").value.trim();

    const snapshot = await get(ref(db, "Registrations"));
    let studentUid = null;
    snapshot.forEach(child => {
      if (child.val().whatsapp === whatsapp) studentUid = child.key;
    });
    if (!studentUid) return alert("No student found with this WhatsApp number!");

    const sendOTP = httpsCallable(functions, "sendWhatsAppOTP");
    await sendOTP({ studentUid, whatsapp });

    alert("OTP sent to your WhatsApp. Enter it below.");

    otpSection.style.display = "block";
    otpSection.innerHTML = `
      <input type="text" id="otpInput" placeholder="Enter OTP" required>
      <input type="password" id="newPassword" placeholder="New Password" required>
      <input type="password" id="confirmNewPassword" placeholder="Confirm Password" required>
      <button id="verifyOTPBtn">Verify OTP & Reset Password</button>
    `;

    document.getElementById("verifyOTPBtn").addEventListener("click", async () => {
      const otpEntered = document.getElementById("otpInput").value.trim();
      const newPass = document.getElementById("newPassword").value;
      const confirmPass = document.getElementById("confirmNewPassword").value;

      if (newPass !== confirmPass) return alert("Passwords do not match!");

      const otpSnapshot = await get(ref(db, `OTP/${studentUid}`));
      if (!otpSnapshot.exists()) return alert("OTP not found!");
      const data = otpSnapshot.val();

      if (parseInt(otpEntered) === data.otp && Date.now() < data.expiresAt) {
        await fetch(`/reset-password?uid=${studentUid}&newPass=${encodeURIComponent(newPass)}`, { method: 'POST' });
        await update(ref(db, `OTP/${studentUid}`), { otp: null });
        alert("Password reset successful!");
        otpSection.style.display = "none";
        forgotBox.style.display = "none";
        loginBox.style.display = "block";
      } else {
        alert("Invalid or expired OTP!");
      }
    });
  });
}

// ------------------- STUDENT PANEL (student.html) -------------------
if (document.getElementById("homeSection")) {
  const studentUid = localStorage.getItem("studentUid");
  if (!studentUid) window.location.href = "index.html";

  const profileDiv = document.getElementById("profileDiv");
  const tuitionTableBody = document.querySelector("#tuitionTable tbody");
  const notificationsDiv = document.getElementById("notificationsDiv");
  const breakRequestBtn = document.getElementById("breakRequestBtn");

  const sections = {
    home: document.getElementById("homeSection"),
    profile: document.getElementById("profileSection"),
    tuition: document.getElementById("tuitionSection"),
    break: document.getElementById("breakSection")
  };

  document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
  document.getElementById("profileTab").addEventListener("click", () => switchTab("profile"));
  document.getElementById("tuitionTab").addEventListener("click", () => switchTab("tuition"));
  document.getElementById("breakTab").addEventListener("click", () => switchTab("break"));

  function switchTab(tabName) {
    for (const key in sections) sections[key].style.display = "none";
    sections[tabName].style.display = "block";
  }

  switchTab("home");

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("studentUid");
    window.location.href = "index.html";
  });

  // Load profile, tuition, notifications, break request
  onValue(ref(db, `Registrations/${studentUid}`), (snapshot) => {
    if (!snapshot.exists()) return alert("Student data not found!");
    const data = snapshot.val();

    profileDiv.innerHTML = `
      <p><strong>Student ID:</strong> ${data.studentId}</p>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Class:</strong> ${data.class}</p>
      <p><strong>Roll:</strong> ${data.roll}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
    `;

    // Tuition
    tuitionTableBody.innerHTML = "";
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    for (let month = 1; month <= currentMonth; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
      const monthName = new Date(currentYear, month-1).toLocaleString('default',{month:'long'});
      const status = data.tuition?.[monthKey]?.status || "unpaid";
      const dateMethod = data.tuition?.[monthKey]?.date ? `${data.tuition[monthKey].date} (${data.tuition[monthKey].method || ""})` : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${monthName}</td><td style="color:${status==="paid"?"green":status==="unpaid"?"red":"purple"}">${status.charAt(0).toUpperCase()+status.slice(1)}</td><td>${dateMethod}</td>`;
      tuitionTableBody.appendChild(tr);
    }
  });

  onValue(ref(db, `Notifications/${studentUid}`), (snapshot) => {
    notificationsDiv.innerHTML = "";
    if (!snapshot.exists()) return notificationsDiv.innerHTML = "<p>No notifications</p>";
    snapshot.forEach(child => {
      const p = document.createElement("p");
      p.textContent = `${child.val().date}: ${child.val().message}`;
      notificationsDiv.appendChild(p);
    });
  });

  breakRequestBtn.addEventListener("click", async () => {
    if (!confirm("Do you want to submit a Break Request?")) return;
    await update(ref(db, `Registrations/${studentUid}`), { breakRequest: true });
    alert("Break request submitted!");
  });
}
