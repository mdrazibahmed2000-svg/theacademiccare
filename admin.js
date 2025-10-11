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

document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // Logout
  // =============================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => window.location.href = "index.html");
    });
  }

  // =============================
  // Tab Navigation
  // =============================
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".section").forEach(s => s.style.display = "none");
      const target = tab.dataset.target;
      document.getElementById(target).style.display = "block";

      if(target === "classSection") loadClassSubTabs();
      if(target === "registrationSection") loadRegistrations();
      if(target === "breakSection") loadBreakRequests();
    });
  });

  // =============================
  // Load Class Sub-Tabs
  // =============================
  function loadClassSubTabs() {
    const container = document.getElementById("classSubTabs");
    container.innerHTML = "";
    for(let c=6; c<=12; c++){
      const btn = document.createElement("button");
      btn.textContent = `Class ${c}`;
      btn.addEventListener("click", () => loadStudentsByClass(c));
      container.appendChild(btn);
    }
  }

  // =============================
  // Load Students by Class
  // =============================
  function loadStudentsByClass(classNumber) {
    const container = document.getElementById("studentsList");
    container.innerHTML = "Loading...";
    db.ref("students").orderByChild("class").equalTo(String(classNumber))
      .on("value", snapshot => {
        container.innerHTML = "";
        snapshot.forEach(studentSnap => {
          const s = studentSnap.val();
          if(s.approved){
            const div = document.createElement("div");
            div.textContent = `${s.name} (${s.studentId}) - WhatsApp: ${s.whatsapp}`;

            // Tuition Fee Icon
            const tuitionBtn = document.createElement("button");
            tuitionBtn.textContent = "Manage Tuition";
            tuitionBtn.addEventListener("click", () => manageTuition(s.studentId));
            div.appendChild(tuitionBtn);

            container.appendChild(div);
          }
        });
      });
  }

  // =============================
// Manage Tuition Fee
// =============================
function manageTuition(studentId){
  const container = document.getElementById("studentsList");
  container.innerHTML = `<h3>Tuition Management for ${studentId}</h3>`;
  const table = document.createElement("table");
  table.style.width = "100%";
  table.border = "1";

  // Table Header
  const header = table.insertRow();
  header.innerHTML = `<th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th>`;

  // Get current month index (0=Jan)
  const now = new Date();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonthIndex = now.getMonth();

  const tuitionRef = db.ref(`tuition/${studentId}`);

  // Load existing tuition data
  tuitionRef.once("value", snapshot => {
    const data = snapshot.val() || {};

    for(let i=0; i<=currentMonthIndex; i++){
      const month = monthNames[i];
      const monthData = data[month] || { status: "Unpaid", date: "", method: "" };
      const row = table.insertRow();

      const statusCell = row.insertCell(1);
      const actionCell = row.insertCell(3);

      row.insertCell(0).textContent = month;
      statusCell.textContent = monthData.status;
      row.insertCell(2).textContent = monthData.date + " " + monthData.method;

      // Action buttons
      if(monthData.status === "Unpaid" || monthData.status === "Break"){
        const markPaidBtn = document.createElement("button");
        markPaidBtn.textContent = "Mark Paid";
        markPaidBtn.addEventListener("click", () => {
          const method = prompt("Enter Payment Method (Bkash/Rocket/Bank)");
          if(!method) return;
          tuitionRef.child(month).set({
            status: "Paid",
            date: new Date().toISOString().split("T")[0],
            method: method
          });
          alert(`Payment marked as Paid for ${month}`);
          manageTuition(studentId); // refresh table
        });

        const markBreakBtn = document.createElement("button");
        markBreakBtn.textContent = "Mark Break";
        markBreakBtn.addEventListener("click", () => {
          tuitionRef.child(month).set({
            status: "Break",
            date: "",
            method: ""
          });
          manageTuition(studentId); // refresh table
        });

        actionCell.appendChild(markPaidBtn);
        actionCell.appendChild(markBreakBtn);
      } else {
        const undoBtn = document.createElement("button");
        undoBtn.textContent = "Undo";
        undoBtn.addEventListener("click", () => {
          tuitionRef.child(month).set({
            status: "Unpaid",
            date: "",
            method: ""
          });
          manageTuition(studentId);
        });
        actionCell.appendChild(undoBtn);
      }

      // Coloring Status
      if(monthData.status === "Paid") statusCell.style.color = "green";
      else if(monthData.status === "Break") statusCell.style.color = "purple";
      else statusCell.style.color = "red";
    }

    container.appendChild(table);
  });
}


  // =============================
  // Load Registration Requests
  // =============================
  function loadRegistrations() {
    const container = document.getElementById("registrationList");
    container.innerHTML = "Loading...";
    db.ref("students").orderByChild("approved").equalTo(false)
      .once("value", snapshot => {
        container.innerHTML = "";
        snapshot.forEach(snap => {
          const s = snap.val();
          const div = document.createElement("div");
          div.textContent = `${s.name} (${s.studentId}) - Class: ${s.class} - Roll: ${s.roll}`;
          
          const approveBtn = document.createElement("button");
          approveBtn.textContent = "Approve";
          approveBtn.addEventListener("click", () => {
            db.ref(`students/${s.studentId}/approved`).set(true);
            loadRegistrations();
          });

          const denyBtn = document.createElement("button");
          denyBtn.textContent = "Deny";
          denyBtn.addEventListener("click", () => {
            db.ref(`students/${s.studentId}`).remove();
            loadRegistrations();
          });

          div.appendChild(approveBtn);
          div.appendChild(denyBtn);
          container.appendChild(div);
        });
      });
  }

  // =============================
  // Load Break Requests
  // =============================
  function loadBreakRequests(){
    const container = document.getElementById("breakRequestsList");
    container.innerHTML = "Loading...";
    db.ref("breakRequests").once("value", snap => {
      container.innerHTML = "";
      snap.forEach(studentSnap => {
        const studentId = studentSnap.key;
        const div = document.createElement("div");
        div.textContent = `Break Request: ${studentId}`;
        container.appendChild(div);
      });
    });
  }

});
