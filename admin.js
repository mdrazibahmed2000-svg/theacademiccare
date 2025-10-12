// ------------------ IMPORTS ------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ------------------ FIREBASE CONFIG ------------------
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL:
    "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ------------------ DOM ELEMENTS ------------------
const homeSection = document.getElementById("homeSection");
const classSection = document.getElementById("classSection");
const registrationSection = document.getElementById("registrationSection");
const breakSection = document.getElementById("breakSection");
const classTableBody = document.getElementById("classTableBody");
const classTitle = document.getElementById("classTitle");
const logoutBtn = document.getElementById("logoutBtn");

// ------------------ NAVIGATION LOGIC ------------------
function hideAllSections() {
  homeSection.style.display = "none";
  classSection.style.display = "none";
  registrationSection.style.display = "none";
  breakSection.style.display = "none";
}

window.showHome = function () {
  hideAllSections();
  homeSection.style.display = "block";
};

window.showRegistration = function () {
  hideAllSections();
  registrationSection.style.display = "block";
  loadRegistrations();
};

window.showBreakRequests = function () {
  hideAllSections();
  breakSection.style.display = "block";
  loadBreakRequests();
};

window.showClass = async function (className) {
  hideAllSections();
  classSection.style.display = "block";
  classTitle.textContent = `Approved Students of Class ${className}`;
  await loadStudentsByClass(className);
};

// ------------------ FETCH APPROVED STUDENTS ------------------
async function loadStudentsByClass(className) {
  classTableBody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  const classRef = ref(db, `students/${className}`);
  const snapshot = await get(classRef);

  if (snapshot.exists()) {
    const students = snapshot.val();
    let html = "";
    let found = false;

    Object.entries(students).forEach(([id, student]) => {
      if (student.status === "approved") {
        found = true;
        html += `
          <tr>
            <td>${id}</td>
            <td>${student.name}</td>
            <td>${student.roll || "-"}</td>
            <td>
              <button class="actionBtn" onclick="openTuitionModal('${className}', '${id}', '${student.name}')">Tuition</button>
            </td>
          </tr>
        `;
      }
    });

    if (!found) {
      html = `<tr><td colspan="4">No approved students found for Class ${className}</td></tr>`;
    }

    classTableBody.innerHTML = html;
  } else {
    classTableBody.innerHTML = `<tr><td colspan="4">No data found for Class ${className}</td></tr>`;
  }
}

// ------------------ TUITION MODAL ------------------
window.openTuitionModal = async function (className, studentId, studentName) {
  const modal = document.getElementById("tuitionModal");
  const modalTableBody = document.querySelector("#modalTuitionTable tbody");
  const modalStudentName = document.getElementById("modalStudentName");
  modal.style.display = "flex";
  modalStudentName.textContent = `Tuition Details - ${studentName} (${studentId})`;

  const tuitionRef = ref(db, `tuition/${className}/${studentId}`);
  const snapshot = await get(tuitionRef);

  if (snapshot.exists()) {
    const tuitionData = snapshot.val();
    let rows = "";
    Object.entries(tuitionData).forEach(([month, info]) => {
      rows += `
        <tr>
          <td>${month}</td>
          <td>${info.status || "Unpaid"}</td>
          <td>${info.dateMethod || "-"}</td>
          <td>
            <button class="actionBtn" onclick="markPaid('${className}', '${studentId}', '${month}')">Mark Paid</button>
            <button class="actionBtn" onclick="markBreak('${className}', '${studentId}', '${month}')">Mark Break</button>
          </td>
        </tr>
      `;
    });
    modalTableBody.innerHTML = rows;
  } else {
    modalTableBody.innerHTML = `<tr><td colspan="4">No tuition record found</td></tr>`;
  }
};

window.closeModal = function () {
  document.getElementById("tuitionModal").style.display = "none";
};

// ------------------ UPDATE TUITION STATUS ------------------
window.markPaid = async function (className, studentId, month) {
  const method = prompt("Enter payment method (Bkash/Cash/etc):");
  if (!method) return;

  const now = new Date();
  const dateMethod = `${now.toLocaleDateString()} (${method})`;

  const updateRef = ref(db, `tuition/${className}/${studentId}/${month}`);
  await update(updateRef, { status: "Paid", dateMethod });
  alert("Payment marked as Paid.");
  openTuitionModal(className, studentId, ""); // refresh modal
};

window.markBreak = async function (className, studentId, month) {
  const updateRef = ref(db, `tuition/${className}/${studentId}/${month}`);
  await update(updateRef, { status: "Break", dateMethod: "-" });
  alert("Marked as Break.");
  openTuitionModal(className, studentId, ""); // refresh modal
};

// ------------------ LOAD REGISTRATION REQUESTS ------------------
async function loadRegistrations() {
  const refReg = ref(db, "registrationRequests");
  const snap = await get(refReg);
  const tbody = document.getElementById("registrationTableBody");

  if (snap.exists()) {
    const data = snap.val();
    let html = "";
    Object.entries(data).forEach(([id, info]) => {
      html += `
        <tr>
          <td>${id}</td>
          <td>${info.name}</td>
          <td>${info.class}</td>
          <td>
            <button class="actionBtn" onclick="approveStudent('${id}', '${info.class}')">Approve</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } else {
    tbody.innerHTML = `<tr><td colspan="4">No registration requests</td></tr>`;
  }
}

// ------------------ LOAD BREAK REQUESTS ------------------
async function loadBreakRequests() {
  const refBreak = ref(db, "breakRequests");
  const snap = await get(refBreak);
  const tbody = document.getElementById("breakTableBody");

  if (snap.exists()) {
    const data = snap.val();
    let html = "";
    Object.entries(data).forEach(([id, info]) => {
      html += `
        <tr>
          <td>${id}</td>
          <td>${info.name}</td>
          <td>${info.class}</td>
          <td>${info.status}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } else {
    tbody.innerHTML = `<tr><td colspan="4">No break requests</td></tr>`;
  }
}

// ------------------ LOGOUT ------------------
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ------------------ CLASS MENU TOGGLE ------------------
const classMenuBtn = document.getElementById("classMenuBtn");
const classSubmenu = document.getElementById("classSubmenu");

classMenuBtn.addEventListener("click", () => {
  classSubmenu.style.display =
    classSubmenu.style.display === "block" ? "none" : "block";
});

window.addEventListener("click", (e) => {
  if (!classMenuBtn.contains(e.target) && !classSubmenu.contains(e.target)) {
    classSubmenu.style.display = "none";
  }
});
