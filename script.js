// ------------------------------
// Firebase Configuration
// ------------------------------
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// ------------------------------
// Helper Functions
// ------------------------------

// Generate Student ID e.g. S20251015
function generateStudentId(cls, roll) {
  const year = new Date().getFullYear();
  return `S${year}${cls}${roll}`;
}

// ------------------------------
// Registration
// ------------------------------
document.getElementById("registerForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const cls = document.getElementById("regClass").value.trim();
  const roll = document.getElementById("regRoll").value.trim();
  const whatsapp = document.getElementById("regWhatsapp").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

  if (!name || !cls || !roll || !whatsapp || !password || !confirmPassword) {
    alert("Please fill all fields!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const studentId = generateStudentId(cls, roll);

  const newStudent = {
    name,
    class: cls,
    roll,
    whatsapp,
    password,
    approved: false,
    studentId
  };

  database.ref("registrations/" + studentId).set(newStudent)
    .then(() => {
      alert(`Registration submitted! Your Student ID is ${studentId}`);
      document.getElementById("registerForm").reset();
    })
    .catch((error) => {
      console.error("Error saving registration:", error);
      alert("Error: " + error.message);
    });
});

// ------------------------------
// Login System (Admin & Student)
// ------------------------------
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const userId = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!userId || !password) {
    alert("Please fill both fields!");
    return;
  }

  // Admin login
  if (userId === "admin") {
    auth.signInWithEmailAndPassword("theacademiccare2025@gmail.com", password)
      .then(() => {
        alert("Admin Login Successful!");
        window.location.href = "admin.html";
      })
      .catch((error) => {
        alert("Admin login failed: " + error.message);
      });
    return;
  }

  // Student login
  database.ref("registrations/" + userId).once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (!data.approved) {
          alert("Your registration is not yet approved by admin.");
          return;
        }

        if (data.password === password) {
          alert("Login successful!");
          localStorage.setItem("studentId", userId);
          window.location.href = "student.html";
        } else {
          alert("Invalid password!");
        }
      } else {
        alert("Student ID not found!");
      }
    })
    .catch((error) => {
      console.error("Error logging in:", error);
      alert("Error: " + error.message);
    });
});

// ------------------------------
// Reset Password (via WhatsApp)
// ------------------------------
document.getElementById("forgotPasswordBtn")?.addEventListener("click", function () {
  alert("Please contact admin via WhatsApp to reset your password.");
});

// ------------------------------
// Admin Panel - Approve Students
// ------------------------------
function loadPendingRegistrations() {
  const tableBody = document.getElementById("pendingRegistrations");
  if (!tableBody) return;

  database.ref("registrations").once("value")
    .then((snapshot) => {
      tableBody.innerHTML = "";
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (!data.approved) {
          const row = `
            <tr>
              <td>${data.name}</td>
              <td>${data.class}</td>
              <td>${data.roll}</td>
              <td>${data.whatsapp}</td>
              <td>${data.studentId}</td>
              <td><button onclick="approveStudent('${data.studentId}')">Approve</button></td>
            </tr>
          `;
          tableBody.innerHTML += row;
        }
      });
    });
}

function approveStudent(studentId) {
  database.ref("registrations/" + studentId).update({ approved: true })
    .then(() => {
      alert("Student approved successfully!");
      loadPendingRegistrations();
    })
    .catch((error) => {
      alert("Error approving student: " + error.message);
    });
}

// Load when admin page opens
if (window.location.pathname.includes("admin.html")) {
  window.onload = loadPendingRegistrations;
}

// ------------------------------
// Student Panel Info
// ------------------------------
function loadStudentProfile() {
  const studentId = localStorage.getItem("studentId");
  if (!studentId) return;

  database.ref("registrations/" + studentId).once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        document.getElementById("studentName").textContent = data.name;
        document.getElementById("studentClass").textContent = data.class;
        document.getElementById("studentRoll").textContent = data.roll;
        document.getElementById("studentWhatsapp").textContent = data.whatsapp;
        document.getElementById("studentIdDisplay").textContent = data.studentId;
      }
    });
}

if (window.location.pathname.includes("student.html")) {
  window.onload = loadStudentProfile;
}
