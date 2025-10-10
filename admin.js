// ================================
// ADMIN PANEL SCRIPT
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, off, update, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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
const studentList = document.getElementById("studentList");
const tuitionPanel = document.getElementById("tuitionPanel");
const classTabsContainer = document.getElementById("classTabs");
const registrationSection = document.getElementById("registrationSection");
const breakRequestSection = document.getElementById("breakRequestSection");

function hideAllSections() {
  studentList.style.display = "none";
  tuitionPanel.style.display = "none";
  registrationSection.style.display = "none";
  breakRequestSection.style.display = "none";
  classTabsContainer.style.display = "none";
}

document.getElementById("homeTab").addEventListener("click", () => {
  hideAllSections();
  // Home content can be added here
});

document.getElementById("classTab").addEventListener("click", () => {
  hideAllSections();
  studentList.style.display = "block";
  classTabsContainer.style.display = "flex";
});

document.getElementById("registrationTab").addEventListener("click", () => {
  hideAllSections();
  registrationSection.style.display = "block";
});

document.getElementById("breakRequestTab").addEventListener("click", () => {
  hideAllSections();
  breakRequestSection.style.display = "block";
});

// ================================
// CLASS SUB-TABS (6-12)
// ================================
let activeListener = null;
for (let i = 6; i <= 12; i++) {
  const tab = document.createElement("button");
  tab.className = "class-sub-tab";
  tab.textContent = `Class ${i}`;
  tab.addEventListener("click", () => loadStudentsOnClick(i));
  classTabsContainer.appendChild(tab);
}

// ================================
// LOAD STUDENTS FOR CLASS
// ================================
function loadStudentsOnClick(classNumber) {
  studentList.innerHTML = `<h3>Class ${classNumber}</h3>`;
  if (activeListener) off(activeListener);

  const classRef = ref(db, "students");
  activeListener = onValue(classRef, (snapshot) => {
    studentList.innerHTML = `<h3>Class ${classNumber}</h3>`;
    snapshot.forEach((child) => {
      const student = child.val();
      if (student.class == classNumber && student.status === "approved") {
        const div = document.createElement("div");
        div.className = "student-card";
        div.innerHTML = `
          <p><strong>${student.name}</strong> (ID: ${student.studentId})</p>
          <p>WhatsApp: ${student.whatsapp}</p>
          <button class="tuition-btn" data-id="${student.studentId}">📘 Tuition Fee Status</button>
        `;
        studentList.appendChild(div);
      }
    });

    document.querySelectorAll(".tuition-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => openTuitionPanel(e.target.getAttribute("data-id")));
    });
  });
}

// ================================
// TUITION PANEL
// ================================
function openTuitionPanel(studentId) {
  const tuitionRef = ref(db, `tuition/${studentId}`);
  tuitionPanel.style.display = "block";
  tuitionPanel.innerHTML = `<h3>Tuition Fee Status for ${studentId}</h3>`;

  onValue(tuitionRef, (snapshot) => {
    tuitionPanel.innerHTML = `<h3>Tuition Fee Status for ${studentId}</h3>
      <table class="tuition-table">
        <tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>
      </table>`;
    const table = tuitionPanel.querySelector(".tuition-table");

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      const record = snapshot.child(month).val() || { status: "Unpaid" };
      let color = record.status === "Paid" ? "green" : record.status === "Break" ? "purple" : "red";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${month}</td>
        <td style="color:${color}; font-weight:bold;">${record.status}</td>
        <td>${record.date || ""} ${record.method ? " | " + record.method : ""}</td>
        <td>
          ${
            record.status === "Paid" || record.status === "Break"
              ? `<button class="undoBtn" data-month="${month}" data-id="${studentId}">Undo</button>`
              : `<button class="paidBtn" data-month="${month}" data-id="${studentId}">Mark Paid</button>
                 <button class="breakBtn" data-month="${month}" data-id="${studentId}">Mark Break</button>`
          }
        </td>
      `;
      table.appendChild(row);
    }

    // ================================
    // TUITION BUTTONS
    // ================================
    document.querySelectorAll(".paidBtn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const month = e.target.getAttribute("data-month");
        const studentId = e.target.getAttribute("data-id");
        const method = prompt("Enter payment method:");
        if (method) {
          const date = new Date().toLocaleDateString();
          update(ref(db, `tuition/${studentId}/${month}`), {
            status: "Paid",
            date,
            method,
          });
        }
      })
    );

    document.querySelectorAll(".breakBtn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const month = e.target.getAttribute("data-month");
        const studentId = e.target.getAttribute("data-id");
        update(ref(db, `tuition/${studentId}/${month}`), { status: "Break" });
      })
    );

    document.querySelectorAll(".undoBtn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const month = e.target.getAttribute("data-month");
        const studentId = e.target.getAttribute("data-id");
        remove(ref(db, `tuition/${studentId}/${month}`));
      })
    );
  });
}
