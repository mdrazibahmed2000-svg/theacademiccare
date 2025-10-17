// ================= IMPORT FIREBASE MODULES =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child, update, set, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ================= FIREBASE CONFIGURATION =================
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "221046264666",
  appId: "1:221046264666:web:1b3a84d7db72e6c417d5da"
};

// ================= INITIALIZE APP =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ================= TAB MANAGEMENT =================
const sections = {
  home: document.getElementById("homeSection"),
  registration: document.getElementById("registrationSection"),
  breaks: document.getElementById("breakSection"),
  classes: document.getElementById("classesSection")
};

function switchTab(tabName) {
  // Hide all sections
  for (const key in sections) {
    sections[key].classList.remove("active-section");
    sections[key].style.display = "none";
  }

  // Show selected section
  const target = sections[tabName];
  if (target) {
    target.style.display = "block";
    setTimeout(() => target.classList.add("active-section"), 10);
  }

  // Highlight active button
  document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("active-tab"));
  document.getElementById(tabName + "Tab")?.classList.add("active-tab");
}

// ================= EVENT LISTENERS =================
document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
document.getElementById("registrationTab").addEventListener("click", () => switchTab("registration"));
document.getElementById("breakTab").addEventListener("click", () => switchTab("breaks"));
document.getElementById("classesTab").addEventListener("click", () => switchTab("classes"));

// ================= LOGOUT FUNCTION =================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
});

// ================= DASHBOARD COUNTS =================
const dbRef = ref(db);
onValue(dbRef, (snapshot) => {
  const data = snapshot.val() || {};
  const students = data.students ? Object.values(data.students) : [];
  const pending = students.filter(s => s.status === "pending").length;
  document.getElementById("totalStudents").textContent = students.length;
  document.getElementById("pendingStudents").textContent = pending;
});

// ================= LOAD REGISTRATIONS =================
async function loadRegistrations() {
  const dbRef = ref(db, "students");
  const snapshot = await get(dbRef);
  const tableBody = document.querySelector("#registrationTable tbody");
  tableBody.innerHTML = "";

  if (snapshot.exists()) {
    const students = snapshot.val();
    for (const id in students) {
      const s = students[id];
      if (s.status === "pending") {
        const row = `
          <tr>
            <td>${s.studentId}</td>
            <td>${s.name}</td>
            <td>${s.class}</td>
            <td>${s.roll}</td>
            <td>${s.whatsapp}</td>
            <td>
              <button class="approve-btn" data-id="${id}">Approve</button>
              <button class="deny-btn" data-id="${id}">Deny</button>
            </td>
          </tr>`;
        tableBody.innerHTML += row;
      }
    }
  }

  // Approve/Deny Handlers
  document.querySelectorAll(".approve-btn").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await update(ref(db, "students/" + id), { status: "approved" });
      alert("Student approved!");
      loadRegistrations();
    })
  );

  document.querySelectorAll(".deny-btn").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await update(ref(db, "students/" + id), { status: "denied" });
      alert("Student denied!");
      loadRegistrations();
    })
  );
}

// ================= LOAD BREAK REQUESTS =================
async function loadBreakRequests() {
  const dbRef = ref(db, "breakRequests");
  const snapshot = await get(dbRef);
  const tableBody = document.querySelector("#breakTable tbody");
  tableBody.innerHTML = "";

  if (snapshot.exists()) {
    const requests = snapshot.val();
    for (const id in requests) {
      const r = requests[id];
      const row = `
        <tr>
          <td>${r.studentId}</td>
          <td>${r.name}</td>
          <td>${r.class}</td>
          <td>${r.roll}</td>
          <td>${r.whatsapp}</td>
          <td>${r.status}</td>
        </tr>`;
      tableBody.innerHTML += row;
    }
  }
}

// ================= LOAD CLASSES =================
async function loadClasses() {
  const dbRef = ref(db, "students");
  const snapshot = await get(dbRef);
  const classTabs = document.getElementById("classTabs");
  const classStudents = document.getElementById("classStudents");

  classTabs.innerHTML = "";
  classStudents.innerHTML = "";

  const classGroups = {};

  if (snapshot.exists()) {
    const students = snapshot.val();
    for (const id in students) {
      const s = students[id];
      if (!classGroups[s.class]) classGroups[s.class] = [];
      classGroups[s.class].push(s);
    }

    for (const cls in classGroups) {
      const btn = document.createElement("button");
      btn.textContent = "Class " + cls;
      btn.addEventListener("click", () => {
        classStudents.innerHTML = `
          <h3>Class ${cls}</h3>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Roll</th>
                <th>WhatsApp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${classGroups[cls].map(s => `
                <tr>
                  <td>${s.studentId}</td>
                  <td>${s.name}</td>
                  <td>${s.roll}</td>
                  <td>${s.whatsapp}</td>
                  <td>${s.status}</td>
                </tr>`).join("")}
            </tbody>
          </table>`;
      });
      classTabs.appendChild(btn);
    }
  }
}

// ================= INITIAL LOAD =================
switchTab("home");
loadRegistrations();
loadBreakRequests();
loadClasses();
