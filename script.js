import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

// Login button
document.getElementById("loginBtn").addEventListener("click", async () => {
    const userInput = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value.trim();

    // ---------------- Admin Login ----------------
    const adminEmail = "theacademiccare2025@gmail.com";

    if(userInput === adminEmail){
        try{
            const userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);
            localStorage.setItem("adminUid", userCredential.user.uid);
            window.location.href = "adminPanel.html";
        }catch(error){
            alert("Admin login failed: " + error.message);
        }
        return;
    }

    // ---------------- Student Login ----------------
    try{
        const snapshot = await get(ref(db, `registrations/${userInput}`));
        if(!snapshot.exists()){
            alert("Student ID not found!");
            return;
        }
        const studentData = snapshot.val();
        if(!studentData.approved){
            alert("Your registration is not approved yet.");
            return;
        }
        // Verify password stored in database
        if(studentData.password !== password){
            alert("Password is incorrect!");
            return;
        }

        localStorage.setItem("studentId", userInput);
        window.location.href = "studentPanel.html";

    }catch(error){
        alert("Student login failed: " + error.message);
    }
});

// Registration button
document.getElementById("registrationBtn").addEventListener("click", () => {
    document.getElementById("registrationForm").style.display = "block";
});

// Submit Registration
document.getElementById("submitRegistration").addEventListener("click", async () => {
    const name = document.getElementById("regName").value.trim();
    const classNum = document.getElementById("regClass").value.trim();
    const roll = document.getElementById("regRoll").value.trim();
    const whatsapp = document.getElementById("regWhatsApp").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

    if(password !== confirmPassword){
        alert("Passwords do not match!");
        return;
    }

    const year = new Date().getFullYear();
    const studentId = `S${year}${classNum}${roll}`;

    await set(ref(db, `registrations/${studentId}`), {
        name, class: parseInt(classNum), roll, whatsapp, password, approved: false
    });

    alert("Registration submitted! Your Student ID is: " + studentId);
    document.getElementById("registrationForm").reset();
});
