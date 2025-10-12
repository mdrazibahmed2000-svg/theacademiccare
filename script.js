// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==================== ELEMENTS =====================
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const forgotBox = document.getElementById("forgotBox");
const registrationBtn = document.getElementById("registrationBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");
const backToLoginBtn2 = document.getElementById("backToLoginBtn2");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

// ==================== NAVIGATION =====================
registrationBtn.addEventListener("click", () => {
  loginBox.style.display = "none";
  registerBox.style.display = "block";
});

backToLoginBtn.addEventListener("click", () => {
  registerBox.style.display = "none";
  loginBox.style.display = "block";
});

backToLoginBtn2.addEventListener("click", () => {
  forgotBox.style.display = "none";
  loginBox.style.display = "block";
});

forgotPasswordBtn.addEventListener("click", () => {
  loginBox.style.display = "none";
  forgotBox.style.display = "block";
});

// ==================== REGISTRATION =====================
document.getElementById("registerForm").addEventListener("submit", (e) => {
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

  db.ref("Registrations/" + studentId).set({
    name,
    class: cls,
    roll,
    whatsapp,
    password,
    status: "pending",
  })
  .then(() => {
    alert(`Registration Submitted! Your Student ID: ${studentId}`);
    document.getElementById("registerForm").reset();
    registerBox.style.display = "none";
    loginBox.style.display = "block";
  })
  .catch((error) => {
    console.error(error);
    alert("Error submitting registration!");
  });
});

// ==================== LOGIN =====================
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (id.toLowerCase() === "admin") {
    // Admin Login
    auth.signInWithEmailAndPassword("theacademiccare2025@gmail.com", password)
      .then(() => {
        alert("Admin logged in successfully!");
        window.location.href = "admin.html";
      })
      .catch(() => {
        alert("Invalid admin credentials!");
      });
  } else {
    // Student Login
    db.ref("ApprovedStudents/" + id).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.password === password) {
          alert("Login Successful!");
          localStorage.setItem("studentId", id);
          window.location.href = "student.html";
        } else {
          alert("Incorrect password!");
        }
      } else {
        alert("Student not found or not yet approved!");
      }
    });
  }
});

// ==================== FORGOT PASSWORD =====================
document.getElementById("forgotForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const whatsapp = document.getElementById("forgotWhatsapp").value.trim();
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmNewPassword").value;

  if (newPass !== confirmPass) {
    alert("Passwords do not match!");
    return;
  }

  db.ref("ApprovedStudents").once("value", (snapshot) => {
    let found = false;
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.whatsapp === whatsapp) {
        found = true;
        db.ref("ApprovedStudents/" + child.key).update({ password: newPass });
        alert("Password reset successful!");
        forgotBox.style.display = "none";
        loginBox.style.display = "block";
      }
    });
    if (!found) alert("No account found with this WhatsApp number!");
  });
});
