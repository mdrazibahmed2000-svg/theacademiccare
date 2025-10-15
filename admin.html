// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child, update, set, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {

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

  function switchTab(tabName) {
    for (const key in sections) sections[key].style.display = "none";
    sections[tabName].style.display = "block";
  }

  document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
  document.getElementById("registrationTab").addEventListener("click", () => switchTab("registration"));
  document.getElementById("breakTab").addEventListener("click", () => switchTab("break"));
  document.getElementById("classesTab").addEventListener("click", () => switchTab("classes"));

  // ------------------- HOME STATS -------------------
  function loadHomeStats() {
    const regRef = ref(db, "Registrations");
    onValue(regRef, snapshot => {
      let total = 0, pending = 0;
      snapshot.forEach(child => {
        total++;
        if (!child.val().approved) pending++;
      });
      document.getElementById("totalStudents").textContent = total;
      document.getElementById("pendingStudents").textContent = pending;
    });
  }

  // ------------------- REGISTRATIONS -------------------
  function loadRegistrations() {
    const regRef = ref(db, "Registrations");
    const tbody = document.querySelector("#registrationTable tbody");

    onValue(regRef, snapshot => {
      tbody.innerHTML = "";
      snapshot.forEach(child => {
        const data = child.val();
        if (data.approved === false) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${child.key}</td>
            <td>${data.name}</td>
            <td>${data.class}</td>
            <td>${data.roll}</td>
            <td><a href="https://wa.me/${data.whatsapp}" target="_blank">📞</a></td>
            <td>
              <button onclick="window.approve('${child.key}')">Approve</button>
              <button onclick="window.deny('${child.key}')">Deny</button>
            </td>
          `;
          tbody.appendChild(tr);
        }
      });
    });
  }

  window.approve = async (id) => {
    await update(ref(db, `Registrations/${id}`), { approved: true });
    alert(`${id} approved!`);
  };

  window.deny = async (id) => {
    await update(ref(db, `Registrations/${id}`), { approved: false });
    alert(`${id} denied!`);
  };

  // ------------------- BREAK REQUESTS -------------------
  function loadBreakRequests() {
    const regRef = ref(db, "Registrations");
    const tbody = document.querySelector("#breakTable tbody");

    onValue(regRef, snapshot => {
      tbody.innerHTML = "";
      snapshot.forEach(child => {
        const data = child.val();
        if (data.breakRequest) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${child.key}</td>
            <td>${data.name}</td>
            <td>${data.class}</td>
            <td>${data.roll}</td>
            <td><a href="https://wa.me/${data.whatsapp}" target="_blank">📞</a></td>
            <td>Requested</td>
          `;
          tbody.appendChild(tr);
        }
      });
    });
  }

  // ------------------- CLASSES -------------------
  function loadClasses() {
    const classTabs = document.getElementById("classTabs");
    const classStudentsDiv = document.getElementById("classStudents");

    for (let cls = 6; cls <= 12; cls++) {
      const btn = document.createElement("button");
      btn.textContent = "Class " + cls;
      btn.addEventListener("click", () => loadClassStudents(cls));
      classTabs.appendChild(btn);
    }

    async function loadClassStudents(cls) {
      const snapshot = await get(ref(db, "Registrations"));
      classStudentsDiv.innerHTML = `
        <h3>Class ${cls}</h3>
        <table border="1">
          <thead><tr>
            <th>ID</th><th>Name</th><th>Roll</th><th>WhatsApp</th><th>Tuition</th>
          </tr></thead>
          <tbody></tbody>
        </table>`;
      const tbody = classStudentsDiv.querySelector("tbody");

      snapshot.forEach(child => {
        const data = child.val();
        if (data.class == cls && data.approved) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${child.key}</td>
            <td>${data.name}</td>
            <td>${data.roll}</td>
            <td><a href="https://wa.me/${data.whatsapp}" target="_blank">📞</a></td>
            <td><span style="cursor:pointer;" onclick="window.showTuitionModal('${child.key}')">💰</span></td>
          `;
          tbody.appendChild(tr);
        }
      });
    }
  }

  // ------------------- TUITION MODAL -------------------
  window.showTuitionModal = async (studentId) => {
    const snapshot = await get(ref(db, `Registrations/${studentId}`));
    if (!snapshot.exists()) return alert("Student not found!");
    const data = snapshot.val();
    let tuition = data.tuition || {};

    const oldModal = document.getElementById("tuitionModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "tuitionModal";
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:1000;";
    modal.innerHTML = `
      <div style="background:white;padding:20px;border-radius:12px;max-height:80%;overflow:auto;width:90%;max-width:800px;">
        <h3>Tuition Details: ${data.name} (${studentId})</h3>
        <table border="1" id="tuitionTable">
          <thead><tr>
            <th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th>
          </tr></thead>
          <tbody></tbody>
        </table>
        <button id="closeModalBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    const tbody = modal.querySelector("tbody");
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    function refreshTable() {
      tbody.innerHTML = "";
      for (let month = 1; month <= currentMonth; month++) {
        const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
        const monthName = new Date(currentYear, month-1).toLocaleString('default', { month: 'long' });
        const status = tuition[monthKey]?.status || "unpaid";
        const dateMethod = tuition[monthKey]?.date ? `${tuition[monthKey].date} (${tuition[monthKey].method})` : "";

        let actions = "";
        if (status === "unpaid") {
          actions = `
            <button onclick="window.markPaid('${studentId}','${monthKey}')">Mark Paid</button>
            <button onclick="window.markBreak('${studentId}','${monthKey}')">Mark Break</button>`;
        } else {
          actions = `<button onclick="window.undoStatus('${studentId}','${monthKey}')">Undo</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${monthName}</td>
          <td style="color:${status==="paid"?"green":status==="unpaid"?"red":"purple"}">${status}</td>
          <td>${dateMethod}</td>
          <td>${actions}</td>
        `;
        tbody.appendChild(tr);
      }
    }

    window.markPaid = async (studentId, monthKey) => {
      const method = prompt("Enter payment method:");
      if (!method) return;
      const date = new Date().toISOString().split("T")[0];
      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "paid", date, method });
      const snap = await get(ref(db, `Registrations/${studentId}/tuition`));
      tuition = snap.val() || {};
      refreshTable();
    };

    window.markBreak = async (studentId, monthKey) => {
      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "break" });
      const snap = await get(ref(db, `Registrations/${studentId}/tuition`));
      tuition = snap.val() || {};
      refreshTable();
    };

    window.undoStatus = async (studentId, monthKey) => {
      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "unpaid", date: null, method: null });
      const snap = await get(ref(db, `Registrations/${studentId}/tuition`));
      tuition = snap.val() || {};
      refreshTable();
    };

    refreshTable();
    document.getElementById("closeModalBtn").addEventListener("click", () => modal.remove());
  };

  // ------------------- INITIAL LOAD -------------------
  switchTab("home");
  loadHomeStats();
  loadRegistrations();
  loadBreakRequests();
  loadClasses();
});
