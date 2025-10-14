// ------------------- IMPORT FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child, update, set, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

  document.getElementById("homeTab").addEventListener("click", () => switchTab("home"));
  document.getElementById("registrationTab").addEventListener("click", () => switchTab("registration"));
  document.getElementById("breakTab").addEventListener("click", () => switchTab("break"));
  document.getElementById("classesTab").addEventListener("click", () => switchTab("classes"));

  function switchTab(tabName) {
    for (const key in sections) sections[key].style.display = "none";
    sections[tabName].style.display = "block";
  }

  // ------------------- HELPER: CREATE REGISTRATIONS NODE IF MISSING -------------------
  async function ensureRegistrationsNode() {
    const snapshot = await get(ref(db, "Registrations"));
    if (!snapshot.exists()) {
      await set(ref(db, "Registrations"), {});
    }
  }

  // ------------------- HOME STATS -------------------
  async function loadHomeStats() {
    await ensureRegistrationsNode();
    const snapshot = await get(ref(db, "Registrations"));
    let total = 0, pending = 0;
    snapshot.forEach(child => {
      total++;
      if (child.val().approved === false) pending++;
    });
    document.getElementById("totalStudents").textContent = total;
    document.getElementById("pendingStudents").textContent = pending;
  }

  // ------------------- LOAD REGISTRATIONS -------------------
  async function loadRegistrations() {
    await ensureRegistrationsNode();
    const snapshot = await get(ref(db, "Registrations"));
    const tbody = document.querySelector("#registrationTable tbody");
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
          <td>${data.whatsapp}</td>
          <td>
            <button onclick="window.approve('${child.key}')">Approve</button>
            <button onclick="window.deny('${child.key}')">Deny</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    });
  }

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

  // ------------------- BREAK REQUESTS -------------------
  async function loadBreakRequests() {
    await ensureRegistrationsNode();
    const snapshot = await get(ref(db, "Registrations"));
    const tbody = document.querySelector("#breakTable tbody");
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
          <td>${data.whatsapp}</td>
          <td>Requested</td>
        `;
        tbody.appendChild(tr);
      }
    });
  }

  // ------------------- CLASSES TAB -------------------
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
    div.innerHTML = `<h3>Class ${cls}</h3><table border="1">
      <thead><tr>
        <th>ID</th><th>Name</th><th>Roll</th><th>Tuition Details</th>
      </tr></thead>
      <tbody></tbody>
    </table>`;
    const tbody = div.querySelector("tbody");

    snapshot.forEach(child => {
      const data = child.val();
      if (data.class == cls && data.approved) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${child.key}</td>
          <td>${data.name}</td>
          <td>${data.roll}</td>
          <td>
            <span class="tuitionIcon" style="cursor:pointer;" onclick="window.showTuitionModal('${child.key}')">💰</span>
          </td>
        `;
        tbody.appendChild(tr);
      }
    });
  }

  // ------------------- TUITION MODAL -------------------
  window.showTuitionModal = async (studentId) => {
    const snapshot = await get(ref(db, `Registrations/${studentId}`));
    if (!snapshot.exists()) return alert("Student not found!");
    const data = snapshot.val();
    let tuition = data.tuition || {};

    // Remove existing modal if exists
    const oldModal = document.getElementById("tuitionModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "tuitionModal";
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;";
    modal.innerHTML = `
      <div style="background:white;padding:20px;border-radius:10px;max-height:80%;overflow:auto;">
        <h3>Tuition Details: ${data.name} (${studentId})</h3>
        <table border="1" id="tuitionTable">
          <thead><tr>
            <th>Month's Name</th><th>Status</th><th>Date & Method</th><th>Action</th>
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

    function populateTable(updatedTuition = tuition) {
      tbody.innerHTML = "";
      for (let month = 1; month <= currentMonth; month++) {
        const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
        const monthName = new Date(currentYear, month-1).toLocaleString('default',{month:'long'});
        const status = updatedTuition[monthKey]?.status || "unpaid";
        const dateMethod = updatedTuition[monthKey]?.date ? `${updatedTuition[monthKey].date} (${updatedTuition[monthKey].method})` : "";

        let actionHtml = "";
        // Pass the studentId and monthKey to the functions
        if (status === "unpaid") {
          actionHtml = `
            <button onclick="window.markPaid('${studentId}','${monthKey}')">Mark Paid</button>
            <button onclick="window.markBreak('${studentId}','${monthKey}')">Mark Break</button>
          `;
        } else {
          actionHtml = `<button onclick="window.undoStatus('${studentId}','${monthKey}')">Undo</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${monthName}</td>
          <td style="color:${status==="paid"?"green":status==="unpaid"?"red":"purple"}">${status.charAt(0).toUpperCase()+status.slice(1)}</td>
          <td>${dateMethod}</td>
          <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
      }
    }

    // ------------------- TUITION ACTIONS -------------------
    // NOTE: These functions must be defined in the global scope (window) 
    // OR called via an event listener inside the modal logic 
    // to dynamically update the modal content without a full refresh.
    // For simplicity, we'll keep them on the window object but update the logic.
    // **IMPORTANT:** Since these functions are defined globally (on `window`), 
    // they don't have direct access to the `populateTable` and `tuition` variables 
    // defined inside `window.showTuitionModal`. You must redefine the
    // `showTuitionModal` to either use more specific event handlers 
    // *or* make `populateTable` accessible, but since `populateTable` uses 
    // local variables (`currentYear`, `currentMonth`, `tbody`), the easiest
    // fix is to **move the logic of re-fetching the data and calling `populateTable`
    // into a self-contained helper function.**

    async function refreshTuitionModal(studentId) {
        const snapshot = await get(ref(db, `Registrations/${studentId}`));
        const data = snapshot.val();
        const updatedTuition = data.tuition || {};
        const tbody = document.querySelector("#tuitionModal tbody");
        
        if (!tbody) return; // Modal is closed, do nothing

        // Redefine populateTable logic locally to use the updated tbody and data
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        tbody.innerHTML = "";
        for (let month = 1; month <= currentMonth; month++) {
            const monthKey = `${currentYear}-${month.toString().padStart(2,"0")}`;
            const monthName = new Date(currentYear, month-1).toLocaleString('default',{month:'long'});
            const status = updatedTuition[monthKey]?.status || "unpaid";
            const dateMethod = updatedTuition[monthKey]?.date ? `${updatedTuition[monthKey].date} (${updatedTuition[monthKey].method})` : "";

            let actionHtml = "";
            if (status === "unpaid") {
                actionHtml = `
                    <button onclick="window.markPaid('${studentId}','${monthKey}')">Mark Paid</button>
                    <button onclick="window.markBreak('${studentId}','${monthKey}')">Mark Break</button>
                `;
            } else {
                actionHtml = `<button onclick="window.undoStatus('${studentId}','${monthKey}')">Undo</button>`;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${monthName}</td>
                <td style="color:${status==="paid"?"green":status==="unpaid"?"red":"purple"}">${status.charAt(0).toUpperCase()+status.slice(1)}</td>
                <td>${dateMethod}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        }
    }


    window.markPaid = async (studentId, monthKey) => {
      const method = prompt("Enter payment method (e.g., Bank Transfer, Cash):");
      if (!method) return;
      const date = new Date().toISOString().split("T")[0];

      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "paid", date, method });
      await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Paid.`, date });

      // Update the modal content dynamically
      await refreshTuitionModal(studentId);
    };

    window.markBreak = async (studentId, monthKey) => {
      const date = new Date().toISOString().split("T")[0];
      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "break" });
      await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Break.`, date });

      // Update the modal content dynamically
      await refreshTuitionModal(studentId);
    };

    window.undoStatus = async (studentId, monthKey) => {
      await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "unpaid", date:null, method:null });

      // Update the modal content dynamically
      await refreshTuitionModal(studentId);
    };

    // Initial table population
    populateTable();

    document.getElementById("closeModalBtn").addEventListener("click", () => {
      modal.remove();
    });
  };

  // ------------------- INITIAL LOAD -------------------
  switchTab("home");
  loadHomeStats();
  loadRegistrations();
  loadBreakRequests();
  loadClasses();
});
