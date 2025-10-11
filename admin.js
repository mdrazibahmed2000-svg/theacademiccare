// =============================
// Firebase Initialization
// =============================
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// =============================
// Logout
// =============================
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
});

// =============================
// Tab Navigation
// =============================
const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(tab.dataset.target).style.display = "block";
    
    if(tab.dataset.target === "classSection") loadClassSubTabs();
    if(tab.dataset.target === "registrationSection") loadRegistrations();
    if(tab.dataset.target === "breakSection") loadBreakRequests();
  });
});

// =============================
// Load Class Sub-tabs (Class 6 - 12)
// =============================
function loadClassSubTabs() {
  const classContainer = document.getElementById("classContainer");
  classContainer.innerHTML = "";
  for (let i = 6; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `Class ${i}`;
    btn.classList.add("classBtn");
    btn.addEventListener("click", () => loadStudents(i));
    classContainer.appendChild(btn);
  }
}

// =============================
// Load Approved Students for a Class
// =============================
function loadStudents(classNum) {
  const div = document.getElementById("studentList");
  div.innerHTML = `<h3>Approved Students (Class ${classNum})</h3>
    <table>
      <thead>
        <tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition</th></tr>
      </thead>
      <tbody id="studentsBody"></tbody>
    </table>`;
  
  const tbody = document.getElementById("studentsBody");

  db.ref("students").once("value", snap => {
    tbody.innerHTML = "";
    let found = false;
    snap.forEach(child => {
      const st = child.val();
      if (st.approved && String(st.class) === String(classNum)) {
        found = true;
        tbody.innerHTML += `
          <tr>
            <td>${st.name}</td>
            <td>${st.studentId || child.key}</td>
            <td>${st.whatsapp}</td>
            <td><button class="tuitionBtn" data-id="${st.studentId || child.key}">💰</button></td>
          </tr>`;
      }
    });

    if (!found) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:gray;">No approved students found in Class ${classNum}</td></tr>`;
    }

    document.querySelectorAll(".tuitionBtn").forEach(btn => {
      btn.addEventListener("click", () => openTuition(btn.dataset.id));
    });
  });
}

// =============================
// Tuition Fee Management
// =============================
function openTuition(studentId) {
  const tuitionDiv = document.getElementById("tuitionTable");
  tuitionDiv.innerHTML = `
    <h3>Tuition Fee Management for ${studentId}</h3>
    <table>
      <thead>
        <tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>
      </thead>
      <tbody id="tuitionBody"></tbody>
    </table>`;

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();
  const tbody = document.getElementById("tuitionBody");

  db.ref(`tuition/${studentId}`).once("value", snap => {
    tbody.innerHTML = "";
    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      const data = snap.child(month).val();
      const status = data?.status || "Unpaid";
      const color = status === "Paid" ? "green" : status === "Break" ? "purple" : "red";
      const dateMethod = data?.date ? `${data.date} (${data.method})` : "-";
      tbody.innerHTML += `
        <tr>
          <td>${month}</td>
          <td style="color:${color}; font-weight:bold;">${status}</td>
          <td>${dateMethod}</td>
          <td>
            ${status === "Paid" || status === "Break" ? 
              `<button onclick="undoStatus('${studentId}','${month}')">Undo</button>` :
              `<button onclick="markPaid('${studentId}','${month}')">Mark Paid</button>
               <button onclick="markBreak('${studentId}','${month}')">Mark Break</button>`}
          </td>
        </tr>`;
    }
  });
}

function markPaid(studentId, month) {
  const method = prompt("Enter payment method:");
  const date = new Date().toLocaleDateString();
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Paid",
    date: date,
    method: method
  });
  openTuition(studentId);
}

function markBreak(studentId, month) {
  const date = new Date().toLocaleDateString();
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Break",
    date: date,
    method: "-"
  });
  openTuition(studentId);
}

function undoStatus(studentId, month) {
  db.ref(`tuition/${studentId}/${month}`).remove();
  openTuition(studentId);
}

// =============================
// Registration Requests
// =============================
function loadRegistrations() {
  const regDiv = document.getElementById("registrationList");
  regDiv.innerHTML = "<h3>Registration Requests</h3>";

  db.ref("students").once("value", snap => {
    let hasPending = false;
    snap.forEach(child => {
      const st = child.val();
      if (!st.approved) {
        hasPending = true;
        const div = document.createElement("div");
        div.classList.add("requestCard");
        div.innerHTML = `
          <p><b>${st.name}</b> (Class ${st.class})</p>
          <p>ID: ${st.studentId || child.key}</p>
          <p>WhatsApp: ${st.whatsapp}</p>
          <button onclick="approveRegistration('${child.key}')">Approve</button>
          <button onclick="denyRegistration('${child.key}')">Deny</button>`;
        regDiv.appendChild(div);
      }
    });
    if(!hasPending) regDiv.innerHTML += "<p style='color:gray;'>No pending registration requests.</p>";
  });
}

function approveRegistration(studentId) {
  db.ref(`students/${studentId}/approved`).set(true);
  loadRegistrations();
}

function denyRegistration(studentId) {
  db.ref(`students/${studentId}`).remove();
  loadRegistrations();
}

// =============================
// Break Requests
// =============================
function loadBreakRequests() {
  const div = document.getElementById("breakRequestList");
  div.innerHTML = "<h3>Break Requests</h3>";

  db.ref("breakRequests").once("value", snap => {
    if (!snap.exists()) return div.innerHTML += "<p style='color:gray;'>No break requests.</p>";
    snap.forEach(child => {
      const req = child.val();
      const months = Object.keys(req).join(", ");
      const card = document.createElement("div");
      card.classList.add("requestCard");
      card.innerHTML = `
        <p>ID: ${child.key}</p>
        <p>Months: ${months}</p>
        <button onclick="approveBreak('${child.key}')">Approve</button>
        <button onclick="denyBreak('${child.key}')">Deny</button>`;
      div.appendChild(card);
    });
  });
}

function approveBreak(studentId) {
  db.ref(`breakRequests/${studentId}`).once("value", snap => {
    snap.forEach(monthSnap => {
      db.ref(`breakRequests/${studentId}/${monthSnap.key}/approved`).set(true);
    });
  });
  loadBreakRequests();
}

function denyBreak(studentId) {
  db.ref(`breakRequests/${studentId}`).remove();
  loadBreakRequests();
}
