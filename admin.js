// Firebase Configuration
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

// Tabs switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
    document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
  });
});

document.getElementById("homeBtn").addEventListener("click", () => {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
  document.getElementById("home").classList.add("active");
});

// Create Class sub-tabs
const classTabsDiv = document.getElementById("classTabs");
for (let i = 6; i <= 12; i++) {
  const btn = document.createElement("button");
  btn.textContent = "Class " + i;
  btn.classList.add("class-btn");
  btn.addEventListener("click", () => loadClassStudents(i));
  classTabsDiv.appendChild(btn);
}

// Load Students per Class
function loadClassStudents(classNum) {
  const studentListDiv = document.getElementById("studentList");
  studentListDiv.innerHTML = `<h3>Students of Class ${classNum}</h3>
  <table>
    <thead><tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition Fee</th></tr></thead>
    <tbody id="studentRows"></tbody>
  </table>`;

  const tbody = document.getElementById("studentRows");
  db.ref("students").orderByChild("class").equalTo(String(classNum)).once("value", (snapshot) => {
    tbody.innerHTML = "";
    snapshot.forEach((child) => {
      const st = child.val();
      const row = `
        <tr>
          <td>${st.name}</td>
          <td>${st.id}</td>
          <td>${st.whatsapp}</td>
          <td><button class="feeStatusBtn" data-id="${st.id}">💰</button></td>
        </tr>`;
      tbody.innerHTML += row;
    });
    document.querySelectorAll(".feeStatusBtn").forEach(btn => {
      btn.addEventListener("click", () => openTuitionFeeModal(btn.dataset.id));
    });
  });
}

// Tuition Fee Modal
const modal = document.getElementById("tuitionFeeModal");
const closeModal = document.getElementById("closeModal");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

function openTuitionFeeModal(studentId) {
  modal.style.display = "block";
  const tbody = document.querySelector("#feeTable tbody");
  tbody.innerHTML = "";

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const currentMonth = new Date().getMonth();

  db.ref("tuitionFees/" + studentId).once("value", (snapshot) => {
    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      const fee = snapshot.child(month).val() || {};
      const status = fee.status || "Unpaid";
      const color = status === "Paid" ? "green" : status === "Break" ? "purple" : "red";
      const method = fee.method || "";
      const date = fee.date || "";
      const actions = status === "Unpaid" ? `
          <button class="markPaid" data-month="${month}" data-id="${studentId}">Mark Paid</button>
          <button class="markBreak" data-month="${month}" data-id="${studentId}">Mark Break</button>`
        : `<button class="undo" data-month="${month}" data-id="${studentId}">Undo</button>`;

      tbody.innerHTML += `
        <tr>
          <td>${month}</td>
          <td style="color:${color};font-weight:bold;">${status}</td>
          <td>${date} ${method}</td>
          <td>${actions}</td>
        </tr>`;
    }

    // Attach event listeners
    document.querySelectorAll(".markPaid").forEach(b =>
      b.addEventListener("click", () => markStatus(b.dataset.id, b.dataset.month, "Paid"))
    );
    document.querySelectorAll(".markBreak").forEach(b =>
      b.addEventListener("click", () => markStatus(b.dataset.id, b.dataset.month, "Break"))
    );
    document.querySelectorAll(".undo").forEach(b =>
      b.addEventListener("click", () => undoStatus(b.dataset.id, b.dataset.month))
    );
  });
}

function markStatus(studentId, month, status) {
  const method = status === "Paid" ? prompt("Enter payment method (Cash/Bkash/etc):") : "";
  const now = new Date().toLocaleDateString();
  db.ref(`tuitionFees/${studentId}/${month}`).set({
    status,
    method,
    date: now
  });
  alert(`Marked as ${status}`);
  openTuitionFeeModal(studentId);
}

function undoStatus(studentId, month) {
  db.ref(`tuitionFees/${studentId}/${month}`).remove();
  alert("Status undone!");
  openTuitionFeeModal(studentId);
}

// Pending Registration
const pendingTable = document.querySelector("#pendingTable tbody");
db.ref("pendingRegistrations").on("value", (snapshot) => {
  pendingTable.innerHTML = "";
  snapshot.forEach((child) => {
    const reg = child.val();
    const row = `
      <tr>
        <td>${reg.name}</td>
        <td>${reg.class}</td>
        <td>${reg.roll}</td>
        <td>${reg.whatsapp}</td>
        <td>
          <button class="approve" data-id="${child.key}">Approve</button>
          <button class="deny" data-id="${child.key}">Deny</button>
        </td>
      </tr>`;
    pendingTable.innerHTML += row;
  });

  document.querySelectorAll(".approve").forEach(b => b.addEventListener("click", () => approveStudent(b.dataset.id)));
  document.querySelectorAll(".deny").forEach(b => b.addEventListener("click", () => denyStudent(b.dataset.id)));
});

function approveStudent(id) {
  db.ref("pendingRegistrations/" + id).once("value", (snap) => {
    const student = snap.val();
    if (student) {
      const studentID = "S" + new Date().getFullYear() + student.class + student.roll;
      db.ref("students/" + studentID).set({
        id: studentID,
        name: student.name,
        class: student.class,
        roll: student.roll,
        whatsapp: student.whatsapp,
        password: student.password,
        status: "Active"
      });
      db.ref("pendingRegistrations/" + id).remove();
      alert("Student approved successfully!");
    }
  });
}

function denyStudent(id) {
  db.ref("pendingRegistrations/" + id).remove();
  alert("Registration denied and removed.");
}

// Break Requests
const breakTable = document.querySelector("#breakTable tbody");
db.ref("breakRequests").on("value", (snapshot) => {
  breakTable.innerHTML = "";
  snapshot.forEach((child) => {
    const req = child.val();
    const row = `
      <tr>
        <td>${req.studentID}</td>
        <td>${req.name}</td>
        <td>${req.reason}</td>
        <td><button class="deleteBreak" data-id="${child.key}">Remove</button></td>
      </tr>`;
    breakTable.innerHTML += row;
  });
  document.querySelectorAll(".deleteBreak").forEach(b =>
    b.addEventListener("click", () => db.ref("breakRequests/" + b.dataset.id).remove())
  );
});
