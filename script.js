// ==========================
// Firebase Initialization
// ==========================
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==========================
// Element References
// ==========================
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerLink = document.getElementById("registerLink");
const backToLoginLink = document.getElementById("backToLoginLink");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

// ==========================
// Toggle Between Login & Registration
// ==========================
if (registerLink) {
  registerLink.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  });
}

if (backToLoginLink) {
  backToLoginLink.addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
  });
}

// ==========================
// Login Function
// ==========================
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const idOrEmail = document.getElementById("loginID").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (idOrEmail === "" || password === "") {
      alert("Please fill all fields!");
      return;
    }

    // Admin Login (via email)
    if (idOrEmail.includes("@")) {
      auth
        .signInWithEmailAndPassword(idOrEmail, password)
        .then(() => {
          // Redirect to admin panel
          window.location.href = "adminPanel.html";
        })
        .catch((error) => {
          alert("Login failed: " + error.message);
        });
    } else {
      // Student Login
      db.ref("students/" + idOrEmail)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            const student = snapshot.val();
            if (student.password === password && student.status === "approved") {
              localStorage.setItem("studentID", idOrEmail);
              window.location.href = "studentPanel.html";
            } else if (student.status !== "approved") {
              alert("Your registration is not approved yet!");
            } else {
              alert("Incorrect password!");
            }
          } else {
            alert("No student found with this ID!");
          }
        })
        .catch((error) => {
          alert("Error: " + error.message);
        });
    }
  });
}

// ==========================
// Registration Function
// ==========================
if (registerBtn) {
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const sClass = document.getElementById("regClass").value.trim();
    const roll = document.getElementById("regRoll").value.trim();
    const whatsapp = document.getElementById("regWhatsapp").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

    if (!name || !sClass || !roll || !whatsapp || !password || !confirmPassword) {
      alert("Please fill all fields!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const year = new Date().getFullYear();
    const studentID = `S${year}${sClass}${roll}`;

    const studentData = {
      name: name,
      class: sClass,
      roll: roll,
      whatsapp: whatsapp,
      password: password,
      status: "pending",
      studentID: studentID,
      tuitionStatus: {}
    };

    db.ref("students/" + studentID)
      .set(studentData)
      .then(() => {
        alert("Registration submitted successfully! Your ID is " + studentID);
        registerForm.reset();
        registerForm.style.display = "none";
        loginForm.style.display = "block";
      })
      .catch((error) => {
        alert("Error submitting registration: " + error.message);
      });
  });
}
