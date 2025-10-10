import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase Config
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
const db = getDatabase(app);
const auth = getAuth(app);

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// -----------------------------
// 🔹 Tab Switching
// -----------------------------
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    tabContents.forEach(tc => tc.style.display = "none");
    document.getElementById(tab).style.display = "block";

    if(tab === "registration") loadRegistrations();
    if(tab === "class") document.getElementById("classContent").innerHTML = "Select a class to see students.";
    if(tab === "breakRequests") loadBreakRequests();
  });
});

// -----------------------------
// 🔹 Class Sub-tabs
// -----------------------------
const subTabButtons = document.querySelectorAll(".sub-tab-btn");
subTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const classNumber = btn.getAttribute("data-class");
    loadClassStudents(classNumber);
  });
});

// -----------------------------
// 🔹 Load Class Students
// -----------------------------
async function loadClassStudents(classNumber) {
  const classDiv = document.getElementById("classContent");
  classDiv.innerHTML = "Loading...";
  try {
    const snapshot = await get(ref(db, "registrations/"));
    if(snapshot.exists()) {
      const students = snapshot.val();
      const approvedStudents = Object.values(students).filter(s => s.class === classNumber && s.approved);
      if(approvedStudents.length === 0) {
        classDiv.innerHTML = "No approved students in this class.";
        return;
      }
      let html = "<table border='1' style='width:100%; text-align:left;'><tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition Status</th></tr>";
      approvedStudents.forEach(s => {
        html += `<tr>
          <td>${s.name}</td>
          <td>${s.studentId}</td>
          <td>${s.whatsapp}</td>
          <td><button onclick="manageTuition('${s.studentId}')">Manage Tuition</button></td>
        </tr>`;
      });
      html += "</table>";
      classDiv.innerHTML = html;
    }
  } catch (error) {
    classDiv.innerHTML = "Error loading students.";
    console.error(error);
  }
}

// -----------------------------
// 🔹 Tuition Management
// -----------------------------
window.manageTuition = async (studentId) => {
  const studentRef = ref(db, "tuition/" + studentId);
  const snapshot = await get(studentRef);
  let tuitionData = snapshot.exists() ? snapshot.val() : {};
  let html = `<h4>Tuition Status for ${studentId}</h4>
    <table border="1" style="width:100%; text-align:left;">
    <tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th><th>Action</th></tr>`;

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  months.forEach((m, i) => {
    let status = tuitionData[m]?.status || "";
    let date = tuitionData[m]?.date || "";
    let method = tuitionData[m]?.method || "";
    html += `<tr>
      <td>${m}</td>
      <td>${status}</td>
      <td>${date}</td>
      <td>${method}</td>
      <td>
        ${status === "" ? `<button onclick="markPaid('${studentId}','${m}')">Mark Paid</button> <button onclick="markBreak('${studentId}','${m}')">Mark Break</button>` :
          `<button onclick="undoTuition('${studentId}','${m}')">Undo</button>`}
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById("classContent").innerHTML = html;
}

// Mark Paid
window.markPaid = async (studentId, month) => {
  const paymentMethod = prompt("Enter payment method:");
  if(!paymentMethod) return;
  const tuitionRef = ref(db, `tuition/${studentId}/${month}`);
  await set(tuitionRef, {status:"Paid", date:new Date().toLocaleDateString(), method:paymentMethod});
  manageTuition(studentId);
}

// Mark Break
window.markBreak = async (studentId, month) => {
  const tuitionRef = ref(db, `tuition/${studentId}/${month}`);
  await set(tuitionRef, {status:"Break", date:"", method:""});
  manageTuition(studentId);
}

// Undo
window.undoTuition = async (studentId, month) => {
  const tuitionRef = ref(db, `tuition/${studentId}/${month}`);
  await set(tuitionRef, {status:"", date:"", method:""});
  manageTuition(studentId);
}

// -----------------------------
// 🔹 Load Registration Requests
// -----------------------------
async function loadRegistrations() {
  const container = document.getElementById("registrationRequests");
  container.innerHTML = "Loading...";
  try {
    const snapshot = await get(ref(db, "registrations/"));
    if(snapshot.exists()) {
      const students = snapshot.val();
      const pending = Object.values(students).filter(s => !s.approved);
      if(pending.length === 0) {
        container.innerHTML = "No pending registrations.";
        return;
      }
      let html = "<table border='1' style='width:100%; text-align:left;'><tr><th>Name</th><th>ID</th><th>Class</th><th>Action</th></tr>";
      pending.forEach(s => {
        html += `<tr>
          <td>${s.name}</td>
          <td>${s.studentId}</td>
          <td>${s.class}</td>
          <td>
            <button onclick="approveStudent('${s.studentId}')">Approve</button>
            <button onclick="denyStudent('${s.studentId}')">Deny</button>
          </td>
        </tr>`;
      });
      html += "</table>";
      container.innerHTML = html;
    }
  } catch(error) {
    container.innerHTML = "Error loading registration requests.";
    console.error(error);
  }
}

// Approve / Deny
window.approveStudent = async (studentId) => {
  await update(ref(db, "registrations/" + studentId), {approved:true});
  loadRegistrations();
}
window.denyStudent = async (studentId) => {
  await set(ref(db, "registrations/" + studentId), null); // delete
  loadRegistrations();
}

// -----------------------------
// 🔹 Load Break Requests
// -----------------------------
async function loadBreakRequests() {
  const container = document.getElementById("breakRequestsList");
  container.innerHTML = "Loading...";
  try {
    const snapshot = await get(ref(db, "breakRequests/"));
    if(snapshot.exists()) {
      const requests = snapshot.val();
      let html = "<table border='1' style='width:100%; text-align:left;'><tr><th>Student ID</th><th>Months</th><th>Action</th></tr>";
      Object.keys(requests).forEach(studentId => {
        html += `<tr>
          <td>${studentId}</td>
          <td>${requests[studentId].months.join(", ")}</td>
          <td>
            <button onclick="approveBreak('${studentId}')">Approve</button>
            <button onclick="denyBreak('${studentId}')">Deny</button>
          </td>
        </tr>`;
      });
      html += "</table>";
      container.innerHTML = html;
    } else {
      container.innerHTML = "No break requests.";
    }
  } catch(error) {
    container.innerHTML = "Error loading break requests.";
    console.error(error);
  }
}

window.approveBreak = async (studentId) => {
  await update(ref(db, `breakRequests/${studentId}`), {approved:true});
  loadBreakRequests();
}
window.denyBreak = async (studentId) => {
  await set(ref(db, `breakRequests/${studentId}`), null);
  loadBreakRequests();
}
// 🔹 Admin Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("✅ Admin logged out successfully!");
    window.location.href = "index.html"; // Redirect to login page
  } catch (error) {
    alert("❌ Logout failed: " + error.message);
  }
});
