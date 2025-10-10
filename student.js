// ================================
// STUDENT PANEL SCRIPT
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase config
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
    alert("Logged out!");
    window.location.href = "index.html";
  });
});

// ================================
// MAIN TABS
// ================================
const profileSection = document.getElementById("profileSection");
const tuitionSection = document.getElementById("tuitionSection");
const breakRequestSection = document.getElementById("breakRequestSection");

function hideAllSections() {
  profileSection.style.display = "none";
  tuitionSection.style.display = "none";
  breakRequestSection.style.display = "none";
}

document.getElementById("homeTab").addEventListener("click", () => hideAllSections());
document.getElementById("myProfileTab").addEventListener("click", () => {
  hideAllSections();
  profileSection.style.display = "block";
  loadProfile();
});
document.getElementById("tuitionTab").addEventListener("click", () => {
  hideAllSections();
  tuitionSection.style.display = "block";
  loadTuition();
});
document.getElementById("breakRequestTab").addEventListener("click", () => {
  hideAllSections();
  breakRequestSection.style.display = "block";
  loadBreakRequests();
});

// ================================
// LOAD PROFILE
// ================================
function loadProfile() {
  const studentId = sessionStorage.getItem("studentId");
  const profileRef = ref(db, `students/${studentId}`);
  onValue(profileRef, (snapshot) => {
    const data = snapshot.val();
    profileSection.innerHTML = `
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>ID:</strong> ${data.studentId}</p>
      <p><strong>Class:</strong> ${data.class}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
    `;
  });
}

// ================================
// LOAD TUITION STATUS
// ================================
function loadTuition() {
  const studentId = sessionStorage.getItem("studentId");
  const tuitionRef = ref(db, `tuition/${studentId}`);
  tuitionSection.innerHTML = `<h3>Tuition Fee Status</h3>
    <table class="tuition-table">
      <tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>
    </table>`;
  const table = tuitionSection.querySelector(".tuition-table");

  onValue(tuitionRef, (snapshot) => {
    table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>`;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const currentMonth = new Date().getMonth();

    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      const record = snapshot.child(month).val() || { status: "Unpaid" };
      let color = record.status === "Paid" ? "green" : record.status === "Break" ? "purple" : "red";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${month}</td>
        <td style="color:${color}; font-weight:bold;">${record.status}</td>
        <td>${record.date || ""} ${record.method ? " | " + record.method : ""}</td>
      `;
      table.appendChild(row);
    }
  });
}

// ================================
// BREAK REQUESTS
// ================================
function loadBreakRequests() {
  const studentId = sessionStorage.getItem("studentId");
  breakRequestSection.innerHTML = `<h3>Request Break</h3>
    <div id="breakMonths"></div>
    <button id="submitBreak">Submit Break Request</button>`;

  const breakMonthsContainer = document.getElementById("breakMonths");
  const currentMonth = new Date().getMonth();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  for (let i = currentMonth + 1; i < 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = months[i];
    btn.className = "break-month-btn";
    btn.addEventListener("click", () => btn.classList.toggle("selected"));
    breakMonthsContainer.appendChild(btn);
  }

  document.getElementById("submitBreak").addEventListener("click", () => {
    const selectedMonths = Array.from(document.querySelectorAll(".break-month-btn.selected")).map(b => b.textContent);
    selectedMonths.forEach(month => {
      push(ref(db, `breakRequests/${studentId}`), { month, status: "pending" });
    });
    alert("Break request submitted!");
  });
}
