import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, off, update, remove, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // LOGOUT
  // -----------------------------
  document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logged out!");
      window.location.href = "index.html";
    });
  });

  // -----------------------------
  // MAIN TABS
  // -----------------------------
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

  document.getElementById("homeTab").addEventListener("click", () => hideAllSections());

  document.getElementById("classTab").addEventListener("click", () => {
    hideAllSections();
    studentList.style.display = "block";
    classTabsContainer.style.display = "flex";
  });

  document.getElementById("registrationTab").addEventListener("click", () => {
    hideAllSections();
    registrationSection.style.display = "block";
    loadRegistrationRequests();
  });

  document.getElementById("breakRequestTab").addEventListener("click", () => {
    hideAllSections();
    breakRequestSection.style.display = "block";
    loadBreakRequests();
  });

  // -----------------------------
  // CLASS SUB-TABS 6-12
  // -----------------------------
  let activeListener = null;
  for (let i = 6; i <= 12; i++) {
    const tab = document.createElement("button");
    tab.className = "class-sub-tab";
    tab.textContent = `Class ${i}`;
    tab.addEventListener("click", () => loadStudentsOnClick(i));
    classTabsContainer.appendChild(tab);
  }

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

  // -----------------------------
  // TUITION PANEL
  // -----------------------------
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

      document.querySelectorAll(".paidBtn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          const month = e.target.getAttribute("data-month");
          const studentId = e.target.getAttribute("data-id");
          const method = prompt("Enter payment method:");
          if (method) {
            const date = new Date().toLocaleDateString();
            update(ref(db, `tuition/${studentId}/${month}`), { status: "Paid", date, method });
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

  // -----------------------------
  // REGISTRATION REQUESTS
  // -----------------------------
  function loadRegistrationRequests() {
    const regRef = ref(db, "students");
    const container = document.getElementById("registrationList");
    onValue(regRef, (snapshot) => {
      container.innerHTML = "";
      snapshot.forEach((child) => {
        const student = child.val();
        if (student.status === "pending") {
          const div = document.createElement("div");
          div.className = "reg-card";
          div.innerHTML = `
            <p>${student.name} (ID: ${student.studentId}) - Class ${student.class}</p>
            <p>WhatsApp: ${student.whatsapp}</p>
            <button class="approveBtn" data-id="${student.studentId}">Approve</button>
            <button class="denyBtn" data-id="${student.studentId}">Deny</button>
          `;
          container.appendChild(div);
        }
      });

      document.querySelectorAll(".approveBtn").forEach(btn => {
        btn.addEventListener("click", e => {
          const id = e.target.getAttribute("data-id");
          update(ref(db, `students/${id}`), { status: "approved" });
        });
      });

      document.querySelectorAll(".denyBtn").forEach(btn => {
        btn.addEventListener("click", e => {
          const id = e.target.getAttribute("data-id");
          remove(ref(db, `students/${id}`));
        });
      });
    });
  }

  // -----------------------------
  // BREAK REQUESTS
  // -----------------------------
  function loadBreakRequests() {
    const breakRef = ref(db, "breakRequests");
    const container = document.getElementById("breakList");
    onValue(breakRef, (snapshot) => {
      container.innerHTML = "";
      snapshot.forEach(child => {
        const studentId = child.key;
        child.forEach(request => {
          const req = request.val();
          if(req.status === "pending"){
            const div = document.createElement("div");
            div.innerHTML = `
              <p>${studentId} requested break for ${req.month}</p>
              <button class="approveBreakBtn" data-student="${studentId}" data-key="${request.key}">Approve</button>
              <button class="denyBreakBtn" data-student="${studentId}" data-key="${request.key}">Deny</button>
            `;
            container.appendChild(div);
          }
        });
      });

      document.querySelectorAll(".approveBreakBtn").forEach(btn => {
        btn.addEventListener("click", e => {
          const studentId = e.target.getAttribute("data-student");
          const key = e.target.getAttribute("data-key");
          update(ref(db, `breakRequests/${studentId}/${key}`), { status: "approved" });
        });
      });

      document.querySelectorAll(".denyBreakBtn").forEach(btn => {
        btn.addEventListener("click", e => {
          const studentId = e.target.getAttribute("data-student");
          const key = e.target.getAttribute("data-key");
          remove(ref(db, `breakRequests/${studentId}/${key}`));
        });
      });
    });
  }

});
