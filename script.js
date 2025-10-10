// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

// Show registration form
showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});

// Show login form
showLoginBtn.addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// LOGIN
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const emailOrId = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  // Admin login
  if(emailOrId === 'theacademiccare2025@gmail.com'){
    auth.signInWithEmailAndPassword(emailOrId, password)
      .then(() => window.location.href = 'adminPanel.html')
      .catch(err => alert(err.message));
  } else {
    // Student login by Student ID
    db.ref('students/' + emailOrId).get().then(snapshot => {
      if(snapshot.exists() && snapshot.val().approved){
        const studentEmail = snapshot.val().email;
        auth.signInWithEmailAndPassword(studentEmail, password)
          .then(() => {
            sessionStorage.setItem('studentId', emailOrId);
            window.location.href = 'studentPanel.html';
          })
          .catch(err => alert(err.message));
      } else {
        alert('Student not approved or invalid ID');
      }
    });
  }
});

// REGISTRATION
registerBtn.addEventListener('click', (e) => {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const cls = document.getElementById('regClass').value.trim();
  const roll = document.getElementById('regRoll').value.trim();
  const whatsapp = document.getElementById('regWhatsapp').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

  if(password !== confirmPassword){
    alert("Passwords do not match");
    return;
  }

  const studentId = 'S2025' + cls + roll;
  const email = studentId + '@theacademiccare.com'; // dummy email for auth

  // Create user in Firebase Auth
  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      // Save in Realtime Database
      db.ref('students/' + studentId).set({
        name,
        class: cls,
        roll,
        whatsapp,
        email,
        approved: false,
        denied: false
      });
      alert('Registration submitted! Your Student ID: ' + studentId);
      registerForm.reset();
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    })
    .catch(err => alert(err.message));
});
