// Firebase initialization
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

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Elements
const loginForm = document.getElementById('loginForm');
const registrationForm = document.getElementById('registrationForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const backLogin = document.getElementById('backLogin');
const submitRegistration = document.getElementById('submitRegistration');

// Toggle forms
registerBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registrationForm.style.display = 'block';
});

backLogin.addEventListener('click', () => {
  registrationForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// Registration
submitRegistration.addEventListener('click', () => {
  const name = document.getElementById('regName').value.trim();
  const cls = document.getElementById('regClass').value.trim();
  const roll = document.getElementById('regRoll').value.trim();
  const whatsapp = document.getElementById('regWhatsapp').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;

  const regError = document.getElementById('regError');
  regError.textContent = '';

  if (!name || !cls || !roll || !whatsapp || !password || !confirmPassword) {
    regError.textContent = 'All fields are required';
    return;
  }

  if (password !== confirmPassword) {
    regError.textContent = "Passwords don't match";
    return;
  }

  const year = new Date().getFullYear();
  const studentId = `S${year}${cls}${roll}`;

  db.ref(`students/${studentId}`).set({
    name, class: cls, roll, whatsapp, password, approved: false, denied: false
  }).then(() => {
    alert(`Registration submitted. Your student ID: ${studentId}`);
    registrationForm.style.display = 'none';
    loginForm.style.display = 'block';
  }).catch(err => {
    regError.textContent = err.message;
  });
});

// Login
loginBtn.addEventListener('click', () => {
  const userId = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('loginError');
  loginError.textContent = '';

  if (!userId || !password) {
    loginError.textContent = 'Enter your credentials';
    return;
  }

  // Admin login
  if (userId === 'theacademiccare2025@gmail.com') {
    auth.signInWithEmailAndPassword(userId, password)
      .then(() => window.location.href = 'adminPanel.html')
      .catch(err => loginError.textContent = err.message);
  } else {
    // Student login: check approval
    db.ref(`students/${userId}`).get().then(snapshot => {
      if (!snapshot.exists()) {
        loginError.textContent = 'Student ID not found';
        return;
      }
      const student = snapshot.val();
      if (!student.approved) {
        loginError.textContent = 'Your registration is not approved yet';
        return;
      }
      if (student.password !== password) {
        loginError.textContent = 'Incorrect password';
        return;
      }
      sessionStorage.setItem('studentId', userId);
      window.location.href = 'studentPanel.html';
    });
  }
});
