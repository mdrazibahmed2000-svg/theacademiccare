// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);

// ------------------- STUDENT ID -------------------
const studentId = localStorage.getItem("studentId");
if (!studentId) window.location.href = "index.html";

// ------------------- ELEMENTS -------------------
const profileDiv = document.getElementById("profileDiv");
const tuitionTableBody = document.querySelector("#tuitionTable tbody");
const notificationsDiv = document.getElementById("notificationsDiv");
const breakRequestBtn = document.getElementById("breakRequestBtn");

// Tabs
const sections = {
  home: document.getElementById("homeSection"),
  profile: document.getElementById("profileSection"),
  tuition: document.getElementById("tuitionSection"),
  break: document.getElementById("breakSection")
};

// ------------------- TAB SWITCHING -------------------
document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
document.getElementById("profileTab").addEventListener("click", () => switchTab("profile"));
document.getElementById("tuitionTab").addEventListener("click", () => switchTab("tuition"));
document.getElementById("breakTab").addEventListener("click", () => switchTab("break"));

function switchTab(tabName) {
  for (const key in sections) sections[key].style.display = "none";
  sections[tabName].style.display = "block";
}

// Show home by default
switchTab("home");

// ------------------- LOGOUT -------------------
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("studentId");
    window.location.href = "index.html";
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});

// ------------------- LOAD STUDENT PROFILE -------------------
function loadProfile(data) {
  profileDiv.innerHTML = `
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Class:</strong> ${data.class}</p>
    <p><strong>Roll:</strong> ${data.roll}</p>
    <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
  `;
}

// ------------------- LOAD TUITION STATUS -------------------
function loadTuition(tuition) {
  tuitionTableBody.innerHTML = "";
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (let month = 1; month <= currentMonth; month++) {
    const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
    const monthName = new Date(currentYear, month-1).toLocaleString('default',{month:'long'});
    const status = tuition?.[monthKey]?.status || "unpaid";
    const dateMethod = tuition?.[monthKey]?.date ? `${tuition[monthKey].date} (${tuition[monthKey].method || ""})` : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${monthName}</td>
      <td style="color:${status==="paid"?"green":status==="unpaid"?"red":"purple"}">${status.charAt(0).toUpperCase()+status.slice(1)}</td>
      <td>${dateMethod}</td>
    `;
    tuitionTableBody.appendChild(tr);
  }
}

// ------------------- LOAD NOTIFICATIONS -------------------
function loadNotifications(notifications) {
  notificationsDiv.innerHTML = "";
  if (!notifications) {
    notificationsDiv.innerHTML = "<p>No notifications</p>";
    return;
  }

  for (const key in notifications) {
    const data = notifications[key];
    const p = document.createElement("p");
    p.textContent = `${data.date}: ${data.message}`;
    notificationsDiv.appendChild(p);
  }
}

// ------------------- BREAK REQUEST -------------------
breakRequestBtn.addEventListener("click", async () => {
  const confirmBreak = confirm("Do you want to submit a Break Request?");
  if (!confirmBreak) return;

  await update(ref(db, `Registrations/${studentId}`), { breakRequest: true });
  alert("Break request submitted!");
});

// ------------------- REAL-TIME LISTENERS -------------------
const studentRef = ref(db, `Registrations/${studentId}`);
onValue(studentRef, (snapshot) => {
  if (!snapshot.exists()) return alert("Student data not found!");
  const data = snapshot.val();
  loadProfile(data);
  loadTuition(data.tuition);
});

const notificationsRef = ref(db, `Notifications/${studentId}`);
onValue(notificationsRef, (snapshot) => {
  loadNotifications(snapshot.val());
});
