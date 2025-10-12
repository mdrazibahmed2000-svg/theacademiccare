import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// ------------------- LOGOUT -------------------
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ------------------- TAB SWITCHING -------------------
const sections = {
  home: document.getElementById("homeSection"),
  registration: document.getElementById("registrationSection"),
  break: document.getElementById("breakSection"),
  classes: document.getElementById("classesSection")
};

document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
document.getElementById("registrationTab").addEventListener("click", () => switchTab("registration"));
document.getElementById("breakTab").addEventListener("click", () => switchTab("break"));
document.getElementById("classesTab").addEventListener("click", () => switchTab("classes"));

function switchTab(tabName) {
  for (const key in sections) sections[key].style.display = "none";
  sections[tabName].style.display = "block";
}

// ------------------- LOAD HOME STATS -------------------
async function loadHomeStats() {
  const snapshot = await get(ref(db, "Registrations"));
  let total = 0, pending = 0;
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      total++;
      if (!child.val().approved) pending++;
    });
  }
  document.getElementById("totalStudents").textContent = total;
  document.getElementById("pendingStudents").textContent = pending;
}

// ------------------- LOAD REGISTRATION LIST -------------------
async function loadRegistrations() {
  const snapshot = await get(ref(db, "Registrations"));
  const tbody = document.querySelector("#registrationTable tbody");
  tbody.innerHTML = "";
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const data = child.val();
      if (!data.approved) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${child.key}</td>
          <td>${data.name}</td>
          <td>${data.class}</td>
          <td>${data.roll}</td>
          <td>${data.whatsapp}</td>
          <td>
            <button onclick="approve('${child.key}')">Approve</button>
            <button onclick="deny('${child.key}')">Deny</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    });
  }
}

// ------------------- APPROVE / DENY -------------------
window.approve = async (id) => {
  await update(ref(db, `Registrations/${id}`), { approved: true });
  alert(`${id} approved!`);
  loadRegistrations();
  loadHomeStats();
};

window.deny = async (id) => {
  await update(ref(db, `Registrations/${id}`), { approved: false });
  alert(`${id} denied!`);
  loadRegistrations();
  loadHomeStats();
};

// ------------------- LOAD BREAK REQUESTS -------------------
async function loadBreakRequests() {
  const snapshot = await get(ref(db, "Registrations"));
  const tbody = document.querySelector("#breakTable tbody");
  tbody.innerHTML = "";
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const data = child.val();
      if (data.breakRequest) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${child.key}</td>
          <td>${data.name}</td>
          <td>${data.class}</td>
          <td>${data.roll}</td>
          <td>${data.whatsapp}</td>
          <td>${data.breakRequest ? "Requested" : "None"}</td>
        `;
        tbody.appendChild(tr);
      }
    });
  }
}

// ------------------- LOAD CLASSES -------------------
async function loadClasses() {
  const classTabs = document.getElementById("classTabs");
  const classStudentsDiv = document.getElementById("classStudents");
  classTabs.innerHTML = "";
  classStudentsDiv.innerHTML = "";

  for (let cls = 6; cls <= 12; cls++) {
    const btn = document.createElement("button");
    btn.textContent = "Class " + cls;
    btn.addEventListener("click", () => loadClassStudents(cls));
    classTabs.appendChild(btn);
  }
}

async function loadClassStudents(cls) {
  const snapshot = await get(ref(db, "Registrations"));
  const div = document.getElementById("classStudents");
  div.innerHTML = `<h3>Class ${cls}</h3><table border="1"><tr><th>ID</th><th>Name</th><th>Roll</th><th>Tuition Status</th></tr></table>`;
  const table = div.querySelector("table");

  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const data = child.val();
      if (data.class == cls && data.approved) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${child.key}</td><td>${data.name}</td><td>${data.roll}</td><td>${data.tuitionStatus || "unpaid"}</td>`;
        table.appendChild(tr);
      }
    });
  }
}

// ------------------- INITIAL LOAD -------------------
loadHomeStats();
loadRegistrations();
loadBreakRequests();
loadClasses();
