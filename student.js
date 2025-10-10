// ================================
// STUDENT PANEL SCRIPT
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ================================
// LOG OUT
// ================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
});

// ================================
// SHOW PROFILE
// ================================
const userId = localStorage.getItem("studentId");
const profileRef = ref(db, `students/${userId}`);
onValue(profileRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    document.getElementById("studentProfile").innerHTML = `
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Class:</strong> ${data.class}</p>
      <p><strong>Roll:</strong> ${data.roll}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
      <p><strong>Student ID:</strong> ${data.studentId}</p>
    `;
  }
});

// ================================
// TUITION STATUS
// ================================
const tuitionRef = ref(db, `tuition/${userId}`);
onValue(tuitionRef, (snapshot) => {
  const table = document.getElementById("tuitionTable");
  table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>`;
  snapshot.forEach((child) => {
    const month = child.key;
    const record = child.val();
    let color =
      record.status === "Paid"
        ? "green"
        : record.status === "Break"
        ? "purple"
        : "red";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${month}</td>
      <td style="color:${color}; font-weight:bold;">${record.status}</td>
      <td>${record.date || ""} ${record.method ? " | " + record.method : ""}</td>
    `;
    table.appendChild(row);
  });
});

// ================================
// BREAK REQUEST
// ================================
const breakRef = ref(db, `breakRequests/${userId}`);
document.getElementById("submitBreakRequest").addEventListener("click", () => {
  const month = document.getElementById("breakMonth").value;
  if (month) {
    update(breakRef, { [month]: "Requested" });
    alert("Break request submitted.");
  }
});
