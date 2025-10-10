// ================================
// ADMIN PANEL SCRIPT
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase configuration
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
// LOAD CLASSES
// ================================
const classTabsContainer = document.getElementById("classTabs");
for (let i = 6; i <= 12; i++) {
  const tab = document.createElement("button");
  tab.className = "class-tab";
  tab.textContent = `Class ${i}`;
  tab.addEventListener("click", () => loadStudents(i));
  classTabsContainer.appendChild(tab);
}

// ================================
// LOAD STUDENTS BY CLASS
// ================================
function loadStudents(classNumber) {
  const classRef = ref(db, "students");
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = `<h3>Class ${classNumber}</h3>`;

  onValue(classRef, (snapshot) => {
    studentList.innerHTML = `<h3>Class ${classNumber}</h3>`;
    snapshot.forEach((childSnapshot) => {
      const student = childSnapshot.val();
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
      btn.addEventListener("click", (e) => {
        const studentId = e.target.getAttribute("data-id");
        openTuitionPanel(studentId);
      });
    });
  });
}

// ================================
// OPEN TUITION PANEL
// ================================
function openTuitionPanel(studentId) {
  const tuitionRef = ref(db, `tuition/${studentId}`);
  const panel = document.getElementById("tuitionPanel");
  panel.innerHTML = `<h3>Tuition Fee Status for ${studentId}</h3>`;
  onValue(tuitionRef, (snapshot) => {
    panel.innerHTML = `<h3>Tuition Fee Status for ${studentId}</h3>
    <table class="tuition-table">
      <tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>
    </table>`;
    const table = panel.querySelector(".tuition-table");

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      const record = snapshot.child(month).val() || { status: "Unpaid" };
      const row = document.createElement("tr");
      let color =
        record.status === "Paid"
          ? "green"
          : record.status === "Break"
          ? "purple"
          : "red";

      row.innerHTML = `
        <td>${month}</td>
        <td style="color:${color}; font-weight:bold;">${record.status}</td>
        <td>${record.date || ""} ${record.method ? " | " + record.method : ""}</td>
        <td>
          ${
            record.status === "Paid" || record.status === "Break"
              ? `<button class="undoBtn" data-month="${month}" data-id="${studentId}">Undo</button>`
              : `
                <button class="paidBtn" data-month="${month}" data-id="${studentId}">Mark Paid</button>
                <button class="breakBtn" data-month="${month}" data-id="${studentId}">Mark Break</button>
              `
          }
        </td>
      `;
      table.appendChild(row);
    }

    addActionListeners();
  });
}

// ================================
// ACTION BUTTONS
// ================================
function addActionListeners() {
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
      update(ref(db, `tuition/${studentId}/${month}`), {
        status: "Break",
      });
    })
  );

  document.querySelectorAll(".undoBtn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const month = e.target.getAttribute("data-month");
      const studentId = e.target.getAttribute("data-id");
      remove(ref(db, `tuition/${studentId}/${month}`));
    })
  );
}
