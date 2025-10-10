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

// Elements
const loginBtn = document.getElementById('loginBtn');
const registrationBtn = document.getElementById('registrationBtn');
const userInput = document.getElementById('userInput');
const passwordInput = document.getElementById('passwordInput');

// Login button
loginBtn.addEventListener('click', () => {
    const inputValue = userInput.value.trim();
    const password = passwordInput.value.trim();

    if (!inputValue || !password) return alert("Please fill all fields.");

    // Check if admin
    db.ref(`users/${firebase.auth().currentUser?.uid || ''}`).once('value').then(snap => {
        const val = snap.val();
        if (val?.isAdmin && val.email === inputValue) {
            // Admin login
            auth.signInWithEmailAndPassword(inputValue, password)
            .then(() => {
                localStorage.setItem('adminId', firebase.auth().currentUser.uid);
                location.href = 'adminPanel.html';
            })
            .catch(err => alert(err.message));
        } else {
            // Student login
            auth.signInWithEmailAndPassword(inputValue, password)
            .then(userCredential => {
                const uid = userCredential.user.uid;
                db.ref(`students/${uid}`).once('value').then(snapshot => {
                    const student = snapshot.val();
                    if (student?.approved) {
                        localStorage.setItem('studentId', uid);
                        location.href = 'studentPanel.html';
                    } else {
                        alert("Your registration is pending approval.");
                        auth.signOut();
                    }
                });
            })
            .catch(err => alert(err.message));
        }
    });
});

// Registration button
registrationBtn.addEventListener('click', () => {
    document.getElementById('registrationForm').style.display = 'block';
});

// Registration form submission
const regForm = document.getElementById('registrationForm');
regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const className = document.getElementById('regClass').value.trim();
    const roll = document.getElementById('regRoll').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

    if (password !== confirmPassword) return alert("Passwords do not match");

    const studentId = `S2025${className}${roll}`;

    // Create student auth
    auth.createUserWithEmailAndPassword(`${studentId}@theacademiccare.com`, password)
    .then(userCredential => {
        const uid = userCredential.user.uid;
        db.ref(`students/${uid}`).set({
            name,
            class: className,
            roll,
            whatsapp,
            approved: false
        });
        alert(`Registration submitted! Your student ID is ${studentId}`);
        regForm.reset();
        regForm.style.display = 'none';
    })
    .catch(err => alert(err.message));
});
