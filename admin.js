// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ------------------- FIREBASE CONFIG -------------------
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

// ------------------- ELEMENTS -------------------
const sections = {
  home: document.getElementById("homeSection"),
  class: document.getElementById("classSection"),
  registration: document.getElementById("registrationSection"),
  break: document.getElementById("breakSection")
};

const logoutBtn = document.getElementById("logoutBtn");
const classMenuBtn = document.getElementById("classMenuBtn");
const classSubmenu = document.getElementById("classSubmenu");

// ------------------- TAB SWITCHING -------------------
function showHome() {
  hideAllSections();
  sections.home.style.display = "block";
}

function showClass(cls) {
  hideAllSections();
  sections.class.style.display = "block";
  document.getElementById("classTitle").innerText = `Class ${cls}`;
  loadClassStudents(cls);
}

function showRegistration() {
  hideAllSections();
  sections.registration.style.display = "block";
  loadRegistrations();
}

function showBreakRequests() {
  hideAllSections();
  sections.break.style.display = "block";
  loadBreakRequests();
}

function hideAllSections() {
  for (let key in sections) sections[key].style.display = "none";
}

// ------------------- CLASS SUBMENU TOGGLE -------------------
classMenuBtn.addEventListener("click", () => {
  classSubmenu.style.display = classSubmenu.style.display === "block" ? "none" : "block";
});

window.addEventListener("click", (e) => {
  if (!classMenuBtn.contains(e.target) && !classSubmenu.contains(e.target)) {
    classSubmenu.style.display = "none";
  }
});

// ------------------- LOGOUT -------------------
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});

// ------------------- LOAD CLASS STUDENTS -------------------
async function loadClassStudents(cls) {
  const tbody = document.getElementById("classTableBody");
  tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const snapshot = await get(ref(db, "Registrations"));
    tbody.innerHTML = "";
    snapshot.forEach(childSnap => {
      const data = childSnap.val();
      if (data.class === cls) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${childSnap.key}</td>
          <td>${data.name}</td>
          <td>${data.roll}</td>
          <td>
            <button class="actionBtn" onclick="openTuitionModal('${childSnap.key}', '${data.name}')">View</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
  }
}

// ------------------- TUITION MODAL -------------------
window.openTuitionModal = async function(studentId, studentName) {
  const modal = document.getElementById("tuitionModal");
  modal.style.display = "block";
  document.getElementById("modalStudentName").innerText = `Tuition for ${studentName}`;
  const tbody = document.querySelector("#modalTuitionTable tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const snapshot = await get(ref(db, `Tuition/${studentId}`));
    tbody.innerHTML = "";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    months.forEach((month, i) => {
      const monthData = snapshot?.val()?.[month] || {};
      const status = monthData.status || "";
      const dateMethod = monthData.dateMethod || "";
      let actionBtns = "";
      if (!status) {
        actionBtns = `
          <button class="actionBtn" onclick="markPaid('${studentId}','${month}')">Mark Paid</button>
          <button class="actionBtn" onclick="markBreak('${studentId}','${month}')">Mark Break</button>
        `;
      } else {
        actionBtns = `<button class="actionBtn" onclick="undo('${studentId}','${month}')">Undo</button>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${month}</td>
        <td style="color:${statusColor(status)}">${status}</td>
        <td>${dateMethod}</td>
        <td>${actionBtns}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
  }
}

window.closeModal = function() {
  document.getElementById("tuitionModal").style.display = "none";
}

// ------------------- TUITION ACTIONS -------------------
function statusColor(status) {
  if (status === "Paid") return "green";
  if (status === "Break") return "purple";
  return "red";
}

window.markPaid = async function(studentId, month) {
  const method = prompt("Enter payment method:");
  if (!method) return alert("Payment method required!");
  await update(ref(db, `Tuition/${studentId}/${month}`), {
    status: "Paid",
    dateMethod: new Date().toLocaleDateString() + " | " + method
  });
  openTuitionModal(studentId, studentId); // refresh modal
}

window.markBreak = async function(studentId, month) {
  await update(ref(db, `Tuition/${studentId}/${month}`), {
    status: "Break",
    dateMethod: new Date().toLocaleDateString()
  });
  openTuitionModal(studentId, studentId);
}

window.undo = async function(studentId, month) {
  await update(ref(db, `Tuition/${studentId}/${month}`), {
    status: "",
    dateMethod: ""
  });
  openTuitionModal(studentId, studentId);
}

// ------------------- LOAD REGISTRATIONS -------------------
async function loadRegistrations() {
  const tbody = document.getElementById("registrationTableBody");
  tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
  try {
    const snapshot = await get(ref(db, "Registrations"));
    tbody.innerHTML = "";
    snapshot.forEach(childSnap => {
      const data = childSnap.val();
      if (!data.approved) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${childSnap.key}</td>
          <td>${data.name}</td>
          <td>${data.class}</td>
          <td>${data.roll}</td>
          <td>
            <button class="actionBtn" onclick="approveRegistration('${childSnap.key}')">Approve</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='5'>Error: ${err.message}</td></tr>`;
  }
}

window.approveRegistration = async function(studentId) {
  await update(ref(db, `Registrations/${studentId}`), { approved: true });
  loadRegistrations();
  alert(`Student ${studentId} approved!`);
}

// ------------------- LOAD BREAK REQUESTS -------------------
async function loadBreakRequests() {
  const tbody = document.getElementById("breakTableBody");
  tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
  try {
    const snapshot = await get(ref(db, "BreakRequests"));
    tbody.innerHTML = "";
    snapshot.forEach(childSnap => {
      const data = childSnap.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${childSnap.key}</td>
        <td>${data.name}</td>
        <td>${data.class}</td>
        <td>${data.roll}</td>
        <td><button class="actionBtn" onclick="resolveBreak('${childSnap.key}')">Resolve</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='5'>Error: ${err.message}</td></tr>`;
  }
}

window.resolveBreak = async function(studentId) {
  await set(ref(db, `BreakRequests/${studentId}`), null);
  loadBreakRequests();
  alert(`Break request for ${studentId} resolved`);
}

// ------------------- INITIAL DISPLAY -------------------
showHome();
