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
  const dbRef = ref(db);
  
  let allRegistrations = {};
  window.currentClass = null; // Variable to store the currently viewed class

  // ------------------- TABS LOGIC -------------------
  const tabs = {
    homeTab: 'homeSection',
    registrationTab: 'registrationSection',
    breakTab: 'breakSection',
    classesTab: 'classesSection'
  };

  for (const tabId in tabs) {
    document.getElementById(tabId).addEventListener('click', () => {
      const targetSectionId = tabs[tabId];
      // Hide all sections
      document.querySelectorAll('.tabSection').forEach(section => {
        section.style.display = 'none';
      });
      // Show target section
      document.getElementById(targetSectionId).style.display = 'block';

      // Load specific data for classes section
      if (targetSectionId === 'classesSection') {
        loadClassesList();
      } else if (targetSectionId === 'registrationSection') {
        loadRegistrations();
      } else if (targetSectionId === 'breakSection') {
        loadBreakRequests();
      } else {
        updateHomeStats();
      }
    });
  }

  // Set initial view to Home
  document.getElementById('homeTab').click();

  // ------------------- LOGOUT -------------------
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAdmin');
      window.location.href = "index.html";
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  });

  // ------------------- DATA LOADERS -------------------
  
  async function loadAllData() {
    try {
      const snapshot = await get(child(dbRef, 'Registrations'));
      if (snapshot.exists()) {
        allRegistrations = snapshot.val();
      } else {
        allRegistrations = {};
      }
      updateHomeStats();
      // Ensure the currently visible section is updated
      const visibleSection = document.querySelector('.tabSection[style*="block"], .tabSection[style=""]');
      if (visibleSection) {
        if (visibleSection.id === 'registrationSection') loadRegistrations();
        if (visibleSection.id === 'breakSection') loadBreakRequests();
        if (visibleSection.id === 'classesSection' && window.currentClass) loadClassStudents(window.currentClass);
      }
    } catch (error) {
      console.error("Error loading all data: ", error);
    }
  }
  
  // Real-time listener for all registrations (simplified for continuous data flow)
  // In a real application, you'd use onValue() here, but keeping it simpler for manual fetches as per existing code structure.
  loadAllData();
  
  // Helper to re-render all relevant data after a change
  window.refreshAllAdminViews = () => {
      loadAllData(); // Re-fetch data and trigger all necessary renders
  };

  // ------------------- HOME STATS -------------------
  function updateHomeStats() {
    const totalStudents = Object.values(allRegistrations).filter(s => s.approved).length;
    const pendingStudents = Object.values(allRegistrations).filter(s => !s.approved).length;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('pendingStudents').textContent = pendingStudents;
  }
  
  // ------------------- REGISTRATIONS -------------------
  function loadRegistrations() {
    const tableBody = document.querySelector('#registrationTable tbody');
    tableBody.innerHTML = '';
    
    for (const id in allRegistrations) {
      const student = allRegistrations[id];
      if (!student.approved) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${id}</td>
          <td>${student.name}</td>
          <td>${student.class}</td>
          <td>${student.roll}</td>
          <td>${student.whatsapp}</td>
          <td data-label="Action:">
            <button onclick="approveStudent('${id}')">Approve</button>
            <button onclick="denyStudent('${id}')">Deny</button>
          </td>
        `;
        tableBody.appendChild(tr);
      }
    }
    if (tableBody.childElementCount === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No pending registrations.</td></tr>';
    }
  }

  window.approveStudent = async (studentId) => {
    await update(ref(db, `Registrations/${studentId}`), { approved: true });
    alert(`Student ${studentId} approved.`);
    window.refreshAllAdminViews();
  };

  window.denyStudent = async (studentId) => {
    if (confirm(`Are you sure you want to deny registration for ${studentId}?`)) {
      await set(ref(db, `Registrations/${studentId}`), null); // Delete the record
      alert(`Student ${studentId} denied and removed.`);
      window.refreshAllAdminViews();
    }
  };

  // ------------------- BREAK REQUESTS -------------------
  function loadBreakRequests() {
    const tableBody = document.querySelector('#breakTable tbody');
    tableBody.innerHTML = '';
    
    for (const id in allRegistrations) {
      const student = allRegistrations[id];
      if (student.approved && student.breakRequest) {
        const tr = document.createElement('tr');
        const statusText = student.breakApproved ? 'Approved' : 'Pending';
        tr.innerHTML = `
          <td>${id}</td>
          <td>${student.name}</td>
          <td>${student.class}</td>
          <td>${student.roll}</td>
          <td>${student.whatsapp}</td>
          <td data-label="Status:">${statusText}</td>
        `;
        tableBody.appendChild(tr);
      }
    }
    if (tableBody.childElementCount === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No pending break requests.</td></tr>';
    }
  }
  
  // ------------------- CLASSES -------------------
  function loadClassesList() {
    const classes = new Set();
    for (const id in allRegistrations) {
      const student = allRegistrations[id];
      if (student.approved) {
        classes.add(student.class);
      }
    }
    
    const classTabsDiv = document.getElementById('classTabs');
    const classStudentsDiv = document.getElementById('classStudents');
    classTabsDiv.innerHTML = '';
    classStudentsDiv.innerHTML = 'Select a class to view students.';

    if (classes.size === 0) {
        classTabsDiv.innerHTML = 'No active classes.';
        return;
    }

    const sortedClasses = Array.from(classes).sort();

    sortedClasses.forEach(className => {
      const button = document.createElement('button');
      button.textContent = className;
      button.onclick = () => {
        window.currentClass = className;
        loadClassStudents(className);
        // Highlight active tab
        document.querySelectorAll('#classTabs button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      };
      classTabsDiv.appendChild(button);
    });

    // Automatically load the first class or the previously selected one
    const classToLoad = window.currentClass || sortedClasses[0];
    if (classToLoad && document.querySelector(`#classTabs button:contains('${classToLoad}')`)) {
        window.currentClass = classToLoad;
        loadClassStudents(classToLoad);
        document.querySelector(`#classTabs button:contains('${classToLoad}')`).classList.add('active');
    }
  }
  
  window.loadClassStudents = (className) => {
    const classStudentsDiv = document.getElementById('classStudents');
    classStudentsDiv.innerHTML = `<h2>Students in ${className}</h2><table id="classStudentsTable"><thead><tr><th>ID</th><th>Name</th><th>Roll</th><th>Tuition</th></tr></thead><tbody></tbody></table>`;
    
    const tableBody = document.querySelector('#classStudentsTable tbody');
    
    for (const id in allRegistrations) {
      const student = allRegistrations[id];
      if (student.approved && student.class === className) {
        // Determine current tuition status (e.g., month before current)
        const now = new Date();
        const currentMonthKey = (now.getMonth() === 0 ? 12 : now.getMonth()) + '-' + (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
        const tuition = student.tuition || {};
        
        // Find the status for the current month
        const status = tuition[currentMonthKey]?.status || 'unpaid';
        const color = status === 'paid' ? 'green' : status === 'break' ? 'purple' : 'red';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${id}</td>
          <td>${student.name}</td>
          <td>${student.roll}</td>
          <td data-label="Tuition:" style="text-align:center;">
            <span style="color:${color}; font-weight:bold">${status.toUpperCase()}</span>
            <span class="tuitionIcon" onclick="showTuitionModal('${id}')">💰</span>
          </td>
        `;
        tableBody.appendChild(tr);
      }
    }
    if (tableBody.childElementCount === 0) {
      tableBody.innerHTML = '<tr><td colspan="4">No students found for this class.</td></tr>';
    }
  };


  // ------------------- TUITION MODAL -------------------
  window.showTuitionModal = async (studentId) => {
    const student = allRegistrations[studentId];
    if (!student) return alert("Student data not found.");

    let modal = document.getElementById('tuitionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tuitionModal';
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }
    
    const tuitionData = student.tuition || {};
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const currentYear = new Date().getFullYear();
    let tableRows = '';

    months.forEach(monthNum => {
      const monthKey = `${monthNum}-${currentYear}`;
      const data = tuitionData[monthKey] || { status: 'unpaid', date: null, method: null };
      const status = data.status || 'unpaid';
      const color = status === 'paid' ? 'green' : status === 'break' ? 'purple' : 'red';
      const dateMethod = data.date && data.method ? `${data.date} (${data.method})` : '-';
      
      let actionButtons = '';
      if (status === 'unpaid') {
        actionButtons = `<button onclick="markPaid('${studentId}', '${monthKey}')">Mark Paid</button>
                         <button onclick="markBreak('${studentId}', '${monthKey}')">Mark Break</button>`;
      } else {
        actionButtons = `<button onclick="undoStatus('${studentId}', '${monthKey}')" style="background:grey;">Undo Status</button>`;
      }

      tableRows += `
        <tr>
          <td>${monthKey}</td>
          <td style="color:${color}; font-weight:bold">${status.charAt(0).toUpperCase() + status.slice(1)}</td>
          <td>${dateMethod}</td>
          <td data-label="Action:">${actionButtons}</td>
        </tr>
      `;
    });

    modal.innerHTML = `
      <div>
        <h3>Tuition Details for ${student.name} (ID: ${studentId})</h3>
        <table id="modalTuitionTable">
          <thead><tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <button onclick="document.getElementById('tuitionModal').style.display='none'">Close</button>
      </div>
    `;

    modal.style.display = 'flex';
  };

  // ------------------- TUITION ACTIONS -------------------
  window.markPaid = async (studentId, monthKey) => {
    const method = prompt("Enter payment method (e.g., Bank Transfer, Cash):");
    if (!method) return;
    const date = new Date().toISOString().split("T")[0];

    await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "paid", date, method });
    await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Paid.`, date });

    // 1. Refresh modal to show updated status
    window.showTuitionModal(studentId);
    
    // 2. Refresh the main table to update the tuition icon status instantly
    if (window.currentClass) {
        window.refreshAllAdminViews(); // Use a general refresh to ensure all stats/views are current
    }
  };

  window.markBreak = async (studentId, monthKey) => {
    await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "break", date: null, method: null });
    await push(ref(db, `Notifications/${studentId}`), { message: `${monthKey} tuition marked Break.`, date: new Date().toISOString().split("T")[0] });

    // 1. Refresh modal to show updated status
    window.showTuitionModal(studentId);
    
    // 2. Refresh the main table to update the tuition icon status instantly
    if (window.currentClass) {
        window.refreshAllAdminViews();
    }
  };

  window.undoStatus = async (studentId, monthKey) => {
    await update(ref(db, `Registrations/${studentId}/tuition/${monthKey}`), { status: "unpaid", date:null, method:null });

    // 1. Refresh modal to show updated status
    window.showTuitionModal(studentId);
    
    // 2. Refresh the main table to update the tuition icon status instantly
    if (window.currentClass) {
        window.refreshAllAdminViews();
    }
  };
  
  // Initialize the first view
  document.getElementById('homeTab').click();
});
// ------------------- END OF DOMContentLoaded -------------------
