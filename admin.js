// Initialize Firebase
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

// ----------------- Run after DOM loads -----------------
document.addEventListener("DOMContentLoaded", () => {

  // --- Tabs ---
  const tabButtons = document.querySelectorAll(".tabBtn");
  const tabContents = document.querySelectorAll(".tabContent");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      tabContents.forEach(tc => tc.style.display = "none");
      document.getElementById(tab + "Tab").style.display = "block";

      if(tab === "classes") loadClasses();
      if(tab === "registration") loadRegistrations();
      if(tab === "breakRequests") loadBreakRequests();
    });
  });

  // Initially show Home tab
  document.getElementById("homeTab").style.display = "block";

  // --- Logout ---
  document.getElementById("logoutBtn").addEventListener("click", () => {
    firebase.auth().signOut().then(() => window.location="index.html")
    .catch(err => console.error("Logout Error:", err));
  });

});

// ----------------- Load Classes & Sub-tabs -----------------
function loadClasses() {
  const classesTab = document.getElementById("classesTab");
  classesTab.innerHTML = ""; // Clear previous

  const classes = ["6","7","8","9","10","11","12"];
  classes.forEach(cls => {
    const subTabBtn = document.createElement("button");
    subTabBtn.textContent = "Class " + cls;
    subTabBtn.addEventListener("click", () => loadStudents(cls));
    classesTab.appendChild(subTabBtn);
  });
}

// Load approved students for a class
function loadStudents(cls) {
  const classesTab = document.getElementById("classesTab");
  const studentDiv = document.createElement("div");
  studentDiv.innerHTML = `<h4>Approved Students - Class ${cls}</h4>`;

  db.ref("students").orderByChild("class").equalTo(cls).once("value").then(snap => {
    const data = snap.val() || {};
    Object.values(data).forEach(stu => {
      if(stu.approved){
        const div = document.createElement("div");
        div.innerHTML = `
          ${stu.name} (${stu.studentId}) - ${stu.whatsapp}
          <button onclick="manageTuition('${stu.studentId}')">Manage Tuition</button>
        `;
        studentDiv.appendChild(div);
      }
    });
  });
  classesTab.appendChild(studentDiv);
}

// Open Tuition Panel
function manageTuition(studentId){
  window.open(`tuitionPanel.html?studentId=${studentId}`, "_blank");
}

// ----------------- Registration Tab -----------------
function loadRegistrations(){
  const regTab = document.getElementById("registrationTab");
  regTab.innerHTML = "<h4>Pending Registrations</h4>";

  db.ref("students").once("value").then(snap => {
    const data = snap.val() || {};
    Object.values(data).forEach(stu => {
      if(!stu.approved){
        const div = document.createElement("div");
        div.innerHTML = `
          ${stu.name} (${stu.studentId}) - ${stu.class} 
          <button onclick="approveStudent('${stu.studentId}')">Approve</button>
          <button onclick="denyStudent('${stu.studentId}')">Deny</button>
        `;
        regTab.appendChild(div);
      }
    });
  });
}

function approveStudent(id){
  db.ref(`students/${id}/approved`).set(true).then(()=> loadRegistrations());
}
function denyStudent(id){
  db.ref(`students/${id}`).remove().then(()=> loadRegistrations());
}

// ----------------- Break Requests Tab -----------------
function loadBreakRequests(){
  const breakTab = document.getElementById("breakRequestsTab");
  breakTab.innerHTML = "<h4>Pending Break Requests</h4>";

  db.ref("breakRequests").once("value").then(snap => {
    const data = snap.val() || {};
    Object.keys(data).forEach(studentId => {
      Object.keys(data[studentId]).forEach(month => {
        if(data[studentId][month].requested && !data[studentId][month].approved){
          const div = document.createElement("div");
          div.innerHTML = `
            ${studentId} - ${month} 
            <button onclick="approveBreak('${studentId}','${month}')">Approve</button>
            <button onclick="denyBreak('${studentId}','${month}')">Deny</button>
          `;
          breakTab.appendChild(div);
        }
      });
    });
  });
}

function approveBreak(studentId, month){
  db.ref(`breakRequests/${studentId}/${month}/approved`).set(true)
    .then(()=> loadBreakRequests());
}
function denyBreak(studentId, month){
  db.ref(`breakRequests/${studentId}/${month}`).remove()
    .then(()=> loadBreakRequests());
}
