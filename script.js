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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Show/Hide Registration Panel
document.getElementById('showRegisterBtn').addEventListener('click', () => {
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('registerPanel').style.display = 'block';
});
document.getElementById('cancelRegisterBtn').addEventListener('click', () => {
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('registerPanel').style.display = 'none';
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
    const uidEmail = document.getElementById('userIdEmail').value.trim();
    const password = document.getElementById('password').value;

    // Admin login
    if (uidEmail === 'theacademiccare2025@gmail.com') {
        auth.signInWithEmailAndPassword(uidEmail, password)
        .then(() => { location.href = 'adminPanel.html'; })
        .catch(err => alert(err.message));
        return;
    }

    // Student login
    db.ref(`students/${uidEmail}`).once('value').then(snap => {
        const student = snap.val();
        if (!student) return alert('Student not found.');
        if (!student.approved) return alert('Registration pending approval.');
        if (student.password !== password) return alert('Incorrect password.');
        localStorage.setItem('studentId', uidEmail);
        location.href = 'studentPanel.html';
    });
});

// Registration
document.getElementById('registerBtn').addEventListener('click', () => {
    const name = document.getElementById('regName').value.trim();
    const cls = document.getElementById('regClass').value.trim();
    const roll = document.getElementById('regRoll').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;

    if (pass !== confirmPass) return alert("Passwords don't match!");

    const year = new Date().getFullYear();
    const studentId = `S${year}${cls}${roll}`;

    db.ref(`students/${studentId}`).set({
        name, class: cls, roll, whatsapp, password: pass, approved: false
    }).then(() => alert(`Registration submitted! Your Student ID: ${studentId}`))
      .catch(err => alert(err.message));
});
