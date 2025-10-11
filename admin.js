// Firebase Configuration (use the same one from script.js)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Tab navigation
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

document.getElementById("homeBtn").addEventListener("click", () => {
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.getElementById("home").classList.add("active");
});

// Load pending registrations
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
      </tr>
    `;
    pendingTable.innerHTML += row;
  });

  document.querySelectorAll(".approve").forEach((btn) => {
    btn.addEventListener("click", () => approveStudent(btn.dataset.id));
  });
  document.querySelectorAll(".deny").forEach((btn) => {
    btn.addEventListener("click", () => denyStudent(btn.dataset.id));
  });
});

function approveStudent(id) {
  db.ref("pendingRegistrations/" + id).once("value", (snapshot) => {
    const student = snapshot.val();
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

// Load classes
const classTabsDiv = document.getElementById("classTabs");
for (let i = 6; i <= 12; i++) {
  const btn = document.createElement("button");
  btn.textContent = "Class " + i;
  btn.classList.add("class-btn");
  btn.addEventListener("click", () => loadClass(i));
  classTabsDiv.appendChild(btn);
}

const classListDiv = document.getElementById("classList");
function loadClass(classNum) {
  db.ref("students").orderByChild("class").equalTo(String(classNum)).once("value", (snapshot) => {
    classListDiv.innerHTML = `<h3>Class ${classNum}</h3><table><tr><th>ID</th><th>Name</th><th>Status</th></tr></table>`;
    snapshot.forEach((child) => {
      const st = child.val();
      const row = `<tr><td>${st.id}</td><td>${st.name}</td><td>${st.status}</td></tr>`;
      classListDiv.querySelector("table").innerHTML += row;
    });
  });
}

// Load break requests
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
        <td><button class="deleteBreak" data-id="${child.key}">Delete</button></td>
      </tr>
    `;
    breakTable.innerHTML += row;
  });

  document.querySelectorAll(".deleteBreak").forEach((btn) => {
    btn.addEventListener("click", () => {
      db.ref("breakRequests/" + btn.dataset.id).remove();
      alert("Break request removed.");
    });
  });
});
