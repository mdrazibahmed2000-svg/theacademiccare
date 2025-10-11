// Firebase Initialization
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

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => location.href="index.html");
});

// Tab Functionality
document.querySelectorAll(".tabBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabContent").forEach(tc => tc.style.display="none");
    document.getElementById(btn.dataset.tab).style.display = "block";
    if(btn.dataset.tab === "classes") loadClasses();
    if(btn.dataset.tab === "registration") loadRegistrations();
    if(btn.dataset.tab === "breakRequests") loadBreakRequests();
  });
});

// Load Classes Sub-tabs
function loadClasses(){
  const subContainer = document.getElementById("subClassTabs");
  subContainer.innerHTML = "";
  for(let c=6;c<=12;c++){
    const btn = document.createElement("button");
    btn.textContent = "Class " + c;
    btn.addEventListener("click", () => loadStudentsByClass(c));
    subContainer.appendChild(btn);
  }
}

// Load Students by Class
function loadStudentsByClass(cls){
  const list = document.getElementById("studentsList");
  list.innerHTML = "";
  db.ref("students").orderByChild("class").equalTo(String(cls)).once("value", snap => {
    const data = snap.val();
    if(!data) return list.textContent="No students in this class.";
    for(let sid in data){
      const s = data[sid];
      if(!s.approved) continue;
      const div = document.createElement("div");
      div.innerHTML = `
        ${s.name} (${s.studentId}) - ${s.whatsapp} 
        <button onclick="manageTuition('${s.studentId}')">Manage Tuition</button>`;
      list.appendChild(div);
    }
  });
}

// Manage Tuition Function (use previous corrected manageTuition function)
function manageTuition(studentId){
  const container = document.getElementById("studentsList");
  container.innerHTML = `<h3>Tuition Management for ${studentId}</h3>`; // header
  // Add the table code from previous message here
}

// Load Registrations
function loadRegistrations(){
  const container = document.getElementById("registrationList");
  container.innerHTML = "";
  db.ref("students").once("value", snap => {
    const data = snap.val();
    for(let sid in data){
      const s = data[sid];
      if(!s.approved){
        const div = document.createElement("div");
        div.innerHTML = `${s.name} (${s.studentId}) 
          <button onclick="approveStudent('${sid}')">Approve</button> 
          <button onclick="denyStudent('${sid}')">Deny</button>`;
        container.appendChild(div);
      }
    }
  });
}

// Approve/Deny Functions
function approveStudent(sid){ db.ref(`students/${sid}/approved`).set(true); loadRegistrations();}
function denyStudent(sid){ db.ref(`students/${sid}`).remove(); loadRegistrations();}

// Load Break Requests
function loadBreakRequests(){
  const container = document.getElementById("breakRequestList");
  container.innerHTML = "";
  db.ref("breakRequests").once("value", snap => {
    const data = snap.val();
    for(let sid in data){
      const months = Object.keys(data[sid]);
      months.forEach(month => {
        const req = data[sid][month];
        if(req.requested && !req.approved){
          const div = document.createElement("div");
          div.innerHTML = `${sid} - ${month} 
            <button onclick="approveBreak('${sid}','${month}')">Approve</button> 
            <button onclick="denyBreak('${sid}','${month}')">Deny</button>`;
          container.appendChild(div);
        }
      });
    }
  });
}

function approveBreak(sid, month){ db.ref(`breakRequests/${sid}/${month}/approved`).set(true); loadBreakRequests();}
function denyBreak(sid, month){ db.ref(`breakRequests/${sid}/${month}`).remove(); loadBreakRequests();}
