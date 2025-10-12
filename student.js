import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// ------------------- ELEMENTS -------------------
const homeTab = document.getElementById("homeTab");
const profileTab = document.getElementById("profileTab");
const tuitionTab = document.getElementById("tuitionTab");
const breakTab = document.getElementById("breakTab");
const studentLogoutBtn = document.getElementById("studentLogoutBtn");

const homeContent = document.getElementById("homeContent");
const profileContent = document.getElementById("profileContent");
const tuitionContent = document.getElementById("tuitionContent");
const breakContent = document.getElementById("breakContent");

const studentId = localStorage.getItem("studentId");
if (!studentId) {
  window.location.href = "index.html";
}

// ------------------- NAVIGATION -------------------
homeTab.addEventListener("click", () => {
  homeContent.style.display = "block";
  profileContent.style.display = "none";
  tuitionContent.style.display = "none";
  breakContent.style.display = "none";
  homeContent.innerHTML = `<h3>Welcome ${studentId}</h3>`;
});

// ------------------- PROFILE -------------------
profileTab.addEventListener("click", async () => {
  homeContent.style.display = "none";
  profileContent.style.display = "block";
  tuitionContent.style.display = "none";
  breakContent.style.display = "none";

  const snapshot = await get(ref(db, `Registrations/${studentId}`));
  const data = snapshot.val();
  profileContent.innerHTML = `<h3>Profile</h3>
    <p>Name: ${data.name}</p>
    <p>Class: ${data.class}</p>
    <p>Roll: ${data.roll}</p>
    <p>WhatsApp: ${data.whatsapp}</p>`;
});

// ------------------- TUITION FEE STATUS -------------------
tuitionTab.addEventListener("click", async () => {
  homeContent.style.display = "none";
  profileContent.style.display = "none";
  tuitionContent.style.display = "block";
  breakContent.style.display = "none";

  const snapshot = await get(ref(db, `TuitionFees/${studentId}`));
  tuitionContent.innerHTML = `<h3>Tuition Fee Status</h3>`;
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const month in data) {
      const status = data[month].paid ? "Paid" : "Pending";
      tuitionContent.innerHTML += `<p>${month}: ${status}</p>`;
    }
  } else {
    tuitionContent.innerHTML += `<p>No fee records found.</p>`;
  }
});

// ------------------- BREAK REQUEST -------------------
breakTab.addEventListener("click", async () => {
  homeContent.style.display = "none";
  profileContent.style.display = "none";
  tuitionContent.style.display = "none";
  breakContent.style.display = "block";

  breakContent.innerHTML = `
    <h3>Break Request</h3>
    <form id="breakForm">
      <input type="text" id="breakReason" placeholder="Reason for break" required>
      <button type="submit">Submit Break Request</button>
    </form>
    <div id="breakStatus"></div>
  `;

  // Display existing break requests
  const snapshot = await get(ref(db, `BreakRequests/${studentId}`));
  const statusDiv = document.getElementById("breakStatus");
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const key in data) {
      statusDiv.innerHTML += `<p>${data[key].reason} - ${data[key].status}</p>`;
    }
  } else {
    statusDiv.innerHTML += `<p>No break requests submitted yet.</p>`;
  }

  // Handle break form submission
  const breakForm = document.getElementById("breakForm");
  breakForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reason = document.getElementById("breakReason").value.trim();
    if (!reason) return;

    const newRef = push(ref(db, `BreakRequests/${studentId}`));
    await set(newRef, { reason, status: "Pending" });
    alert("Break request submitted!");
    document.getElementById("breakReason").value = "";
    location.reload();
  });
});

// ------------------- LOGOUT -------------------
studentLogoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentId");
  window.location.href = "index.html";
});
