// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
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
const db = getDatabase(app);

const classSection = document.getElementById("classSection");
const classTitle = document.getElementById("classTitle");
const classTableBody = document.getElementById("classTableBody");
let studentsData = {};

// ------------------- LOAD STUDENTS REAL-TIME -------------------
const studentsRef = ref(db, "Registrations");
onValue(studentsRef, snapshot => {
  studentsData = snapshot.val() || {};
  const visibleClass = classTitle.textContent.split(" ")[1];
  if (visibleClass) showClass(visibleClass);
});

// ------------------- SHOW CLASS -------------------
window.showClass = (cls) => {
  classTitle.textContent = `Class ${cls}`;
  classSection.style.display = "block";
  classTableBody.innerHTML = "";

  for (const id in studentsData) {
    const student = studentsData[id];
    if (student.class === cls) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${student.name}</td>
        <td>${student.roll}</td>
        <td><button onclick="showTuitionModal('${id}')">${getTuitionStatus(student)}</button></td>
      `;
      classTableBody.appendChild(tr);
    }
  }
};

function getTuitionStatus(student) {
  if (!student.tuition) return "Unpaid";
  const months = Object.keys(student.tuition);
  if (!months.length) return "Unpaid";
  // Get latest month
  const latest = months.sort().pop();
  return student.tuition[latest].status.charAt(0).toUpperCase() + student.tuition[latest].status.slice(1);
}

// ------------------- TUITION MODAL -------------------
window.showTuitionModal = (studentId) => {
  const modal = document.getElementById("tuitionModal");
  const tbody = document.querySelector("#modalTuitionTable tbody");
  const student = studentsData[studentId];
  document.getElementById("modalStudentName").textContent = `Tuition for ${student.name}`;
  tbody.innerHTML = "";

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (let month = 1; month <= currentMonth; month++) {
    const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
    const monthName = new Date(currentYear, month-1).toLocaleString('default',{month:'long'});
    const tuition = student.tuition?.[monthKey] || { status: "unpaid", date: null, method: null };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${monthName}</td>
      <td style="color:${tuition.status==="paid"?"green":tuition.status==="unpaid"?"red":"purple"}">${tuition.status.charAt(0).toUpperCase()+tuition.status.slice(1)}</td>
      <td>${tuition.date ? `${tuition.date} (${tuition.method || ""})` : ""}</td>
      <td>
        ${tuition.status === "unpaid" ? `<button onclick="markPaid('${studentId}','${monthKey}')">Mark Paid</button>
        <button onclick="markBreak('${studentId}','${monthKey}')">Mark Break</button>` : 
        `<button onclick="undoStatus('${studentId}','${monthKey}')">Undo</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  }

  modal.style.display = "block";
};

window.closeModal = () => {
  document.getElementById("tuitionModal").style.display = "none";
};

// ------------------- MARK PAID / BREAK / UNDO -------------------
window.markPaid = async (studentId, monthKey) => {
  const method = prompt("Enter payment method:");
  if (!method) return alert("Payment method required!");
  const date = new Date().toISOString().split("T")[0];
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "paid", date, method });
  await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Paid`, date });
  showTuitionModal(studentId);
};

window.markBreak = async (studentId, monthKey) => {
  const date = new Date().toISOString().split("T")[0];
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "break", date, method: null });
  await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Break`, date });
  showTuitionModal(studentId);
};

window.undoStatus = async (studentId, monthKey) => {
  await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "unpaid", date: null, method: null });
  showTuitionModal(studentId);
};

// ------------------- HOME -------------------
window.showHome = () => {
  classSection.style.display = "none";
};
