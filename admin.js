// Firebase config same as script.js
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ---------------- TAB MENU -----------------
const menuBtns = document.querySelectorAll(".menuBtn");
const tabs = document.querySelectorAll(".tabContent");
menuBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(tab => tab.style.display = "none");
    document.getElementById(btn.dataset.tab).style.display = "block";
  });
});

// ---------------- LOGOUT -----------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
});

// ---------------- LOAD PENDING REGISTRATIONS -----------------
function loadPending() {
  db.ref("Registrations").once("value").then(snapshot => {
    const table = document.getElementById("pendingTable");
    table.innerHTML = `<tr>
      <th>Student ID</th><th>Name</th><th>Class</th><th>Roll</th><th>WhatsApp</th><th>Action</th>
    </tr>`;

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
          </td>`;
        table.appendChild(tr);
      }
    });
  });
}

// ---------------- APPROVE / DENY -----------------
window.approve = function(id) {
  db.ref("Registrations/" + id).update({ approved: true });
  alert("Approved " + id);
  loadPending();
  loadClasses();
};

window.deny = function(id) {
  db.ref("Registrations/" + id).remove();
  alert("Denied " + id);
  loadPending();
};

// ---------------- LOAD APPROVED STUDENTS BY CLASS -----------------
function loadClasses() {
  db.ref("Registrations").once("value").then(snapshot => {
    const container = document.getElementById("classesContainer");
    container.innerHTML = "";
    let classes = {};

    snapshot.forEach(child => {
      const data = child.val();
      if (data.approved) {
        if (!classes[data.class]) classes[data.class] = [];
        classes[data.class].push({ id: child.key, name: data.name, roll: data.roll, whatsapp: data.whatsapp });
      }
    });

    for (let cls in classes) {
      const div = document.createElement("div");
      div.innerHTML = `<h3>Class ${cls}</h3>`;
      let table = `<table border="1">
        <tr><th>Student ID</th><th>Name</th><th>Roll</th><th>WhatsApp</th></tr>`;
      classes[cls].forEach(s => {
        table += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.roll}</td><td>${s.whatsapp}</td></tr>`;
      });
      table += "</table>";
      div.innerHTML += table;
      container.appendChild(div);
    }
  });
}

// Initialize
loadPending();
loadClasses();
