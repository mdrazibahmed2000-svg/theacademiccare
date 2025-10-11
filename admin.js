// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🔹 Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

// 🔹 Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (btn.dataset.tab === "classes") showClassSubTabs();
  });
});

// 🔹 Show Class sub-tabs dynamically
function showClassSubTabs() {
  const container = document.getElementById("classSubTabs");
  container.innerHTML = "";
  for (let i = 6; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = "Class " + i;
    btn.onclick = () => loadStudents(i);
    container.appendChild(btn);
  }
}

// 🔹 Load approved students
function loadStudents(classNum) {
  const div = document.getElementById("studentList");
  div.innerHTML = `<h3>Approved Students (Class ${classNum})</h3>
  <table><thead><tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition</th></tr></thead><tbody id="students"></tbody></table>`;

  const tbody = document.getElementById("students");
  db.ref("students").orderByChild("class").equalTo(String(classNum)).once("value", snap => {
    tbody.innerHTML = "";
    snap.forEach(child => {
      const st = child.val();
      tbody.innerHTML += `
        <tr>
          <td>${st.name}</td>
          <td>${st.id}</td>
          <td>${st.whatsapp}</td>
          <td><button class="tuitionBtn" data-id="${st.id}">💰</button></td>
        </tr>`;
    });
    document.querySelectorAll(".tuitionBtn").forEach(b => b.addEventListener("click", () => openTuition(b.dataset.id)));
  });
}

// 🔹 Tuition modal
const modal = document.getElementById("tuitionModal");
const closeModal = document.getElementById("closeModal");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

function openTuition(studentId) {
  modal.style.display = "flex";
  const tbody = document.querySelector("#feeTable tbody");
  tbody.innerHTML = "";
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const current = new Date().getMonth();

  db.ref("tuitionFees/" + studentId).once("value", snap => {
    for (let i = 0; i <= current; i++) {
      const m = months[i];
      const fee = snap.child(m).val() || {};
      const status = fee.status || "Unpaid";
      const color = status === "Paid" ? "green" : status === "Break" ? "purple" : "red";
      const actions = status === "Unpaid"
        ? `<button class='markPaid' data-month='${m}' data-id='${studentId}'>Mark Paid</button>
           <button class='markBreak' data-month='${m}' data-id='${studentId}'>Mark Break</button>`
        : `<button class='undo' data-month='${m}' data-id='${studentId}'>Undo</button>`;
      tbody.innerHTML += `
        <tr>
          <td>${m}</td>
          <td style='color:${color};font-weight:bold;'>${status}</td>
          <td>${fee.date || ""} ${fee.method || ""}</td>
          <td>${actions}</td>
        </tr>`;
    }

    document.querySelectorAll(".markPaid").forEach(b => b.addEventListener("click", () => markStatus(b.dataset.id, b.dataset.month, "Paid")));
    document.querySelectorAll(".markBreak").forEach(b => b.addEventListener("click", () => markStatus(b.dataset.id, b.dataset.month, "Break")));
    document.querySelectorAll(".undo").forEach(b => b.addEventListener("click", () => undoStatus(b.dataset.id, b.dataset.month)));
  });
}

function markStatus(studentId, month, status) {
  const method = status === "Paid" ? prompt("Enter payment method:") : "";
  const date = new Date().toLocaleDateString();
  db.ref(`tuitionFees/${studentId}/${month}`).set({ status, method, date });
  alert(`Marked as ${status}`);
  openTuition(studentId);
}
function undoStatus(studentId, month) {
  db.ref(`tuitionFees/${studentId}/${month}`).remove();
  alert("Status undone");
  openTuition(studentId);
}

// 🔹 Registration Management
const pendingTable = document.querySelector("#pendingTable tbody");
db.ref("pendingRegistrations").on("value", snap => {
  pendingTable.innerHTML = "";
  snap.forEach(child => {
    const s = child.val();
    pendingTable.innerHTML += `
      <tr>
        <td>${s.name}</td><td>${s.class}</td><td>${s.roll}</td><td>${s.whatsapp}</td>
        <td>
          <button class="approve" data-id="${child.key}">Approve</button>
          <button class="deny" data-id="${child.key}">Deny</button>
        </td>
      </tr>`;
  });
  document.querySelectorAll(".approve").forEach(b => b.addEventListener("click", () => approveStudent(b.dataset.id)));
  document.querySelectorAll(".deny").forEach(b => b.addEventListener("click", () => denyStudent(b.dataset.id)));
});

function approveStudent(id) {
  db.ref("pendingRegistrations/" + id).once("value", snap => {
    const st = snap.val();
    if (st) {
      const sid = "S" + new Date().getFullYear() + st.class + st.roll;
      db.ref("students/" + sid).set({ ...st, id: sid });
      db.ref("pendingRegistrations/" + id).remove();
      alert("Approved successfully!");
    }
  });
}
function denyStudent(id) {
  db.ref("pendingRegistrations/" + id).remove();
  alert("Denied successfully!");
}

// 🔹 Break Requests
const breakTable = document.querySelector("#breakTable tbody");
db.ref("breakRequests").on("value", snap => {
  breakTable.innerHTML = "";
  snap.forEach(child => {
    const r = child.val();
    breakTable.innerHTML += `
      <tr>
        <td>${r.studentID}</td><td>${r.name}</td><td>${r.reason}</td>
        <td><button class='removeBreak' data-id='${child.key}'>Remove</button></td>
      </tr>`;
  });
  document.querySelectorAll(".removeBreak").forEach(b => b.addEventListener("click", () => {
    db.ref("breakRequests/" + b.dataset.id).remove();
    alert("Break request removed");
  }));
});
