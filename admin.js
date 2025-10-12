// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ------------------- CONFIG -------------------
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

// ------------------- MARK PAID / BREAK -------------------
window.markPaid = async (studentId, monthKey) => {
  const method = prompt("Enter payment method (e.g., bKash, Rocket):");
  if (!method) return alert("Payment method is required!");

  const date = new Date().toISOString().split("T")[0];
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "paid", date, method });

  // Send notification to student
  await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Paid`, date });

  // Update buttons in modal
  window.showTuitionModal(studentId);
};

window.markBreak = async (studentId, monthKey) => {
  const date = new Date().toISOString().split("T")[0];
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "break", date, method: null });

  await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Break`, date });
  window.showTuitionModal(studentId);
};

window.undoStatus = async (studentId, monthKey) => {
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "unpaid", date: null, method: null });
  alert(`Status reset for ${monthKey}`);
  window.showTuitionModal(studentId);
};

// ------------------- REAL-TIME STUDENT LISTENING -------------------
const studentsRef = ref(db, "Registrations");
onValue(studentsRef, (snapshot) => {
  const students = snapshot.val();
  for (const studentId in students) {
    // Update each student row dynamically in your class table
    window.updateStudentRow?.(studentId, students[studentId]);
  }
});
