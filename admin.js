import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasedatabase.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ---------------- Logout ----------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href="index.html");
});

// ---------------- Tabs ----------------
const tabs = document.querySelectorAll(".tabBtn");
tabs.forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tabContent").forEach(tc => tc.style.display="none");
  document.getElementById(tab.dataset.tab).style.display="block";
}));

// ---------------- Load Registration Requests ----------------
const registrationRef = ref(db, "students");
const registrationDiv = document.getElementById("registrationRequests");

onValue(registrationRef, snapshot => {
  registrationDiv.innerHTML = "";
  snapshot.forEach(snap => {
    const student = snap.val();
    if(student.status === "pending") {
      const div = document.createElement("div");
      div.innerHTML = `${student.name} | ${student.class} | ${student.roll} 
        <button onclick="approve('${student.studentId}')">Approve</button>
        <button onclick="deny('${student.studentId}')">Deny</button>`;
      registrationDiv.appendChild(div);
    }
  });
});

// ---------------- Approve / Deny ----------------
window.approve = function(id){
  update(ref(db, `students/${id}`), {status:"approved"});
}

window.deny = function(id){
  update(ref(db, `students/${id}`), {status:"denied"});
}

// ---------------- Load Classes ----------------
const classContent = document.getElementById("classContent");
const subTabs = document.querySelectorAll(".subTabBtn");
subTabs.forEach(btn => btn.addEventListener("click", () => loadClass(btn.dataset.class)));

function loadClass(cls){
  classContent.innerHTML = `<h4>Class ${cls}</h4>`;
  onValue(ref(db, "students"), snapshot => {
    classContent.innerHTML = `<h4>Class ${cls}</h4>`;
    snapshot.forEach(snap => {
      const student = snap.val();
      if(student.status === "approved" && student.class == cls){
        const div = document.createElement("div");
        div.innerHTML = `${student.name} | ${student.studentId} | ${student.whatsapp} 
          <button onclick="manageTuition('${student.studentId}')">Tuition</button>`;
        classContent.appendChild(div);
      }
    });
  });
}

// ---------------- Tuition Management ----------------
window.manageTuition = function(studentId){
  const tuitionDiv = document.createElement("div");
  tuitionDiv.innerHTML = `<h5>Tuition for ${studentId}</h5>`;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let table = "<table border='1'><tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>";
  const tRef = ref(db, `tuition/${studentId}`);
  onValue(tRef, snap=>{
    months.forEach(m=>{
      const monthData = snap.val() && snap.val()[m] ? snap.val()[m] : {status:"Unpaid", date:"", method:""};
      table += `<tr>
        <td>${m}</td>
        <td id="${studentId}_${m}_status">${monthData.status}</td>
        <td id="${studentId}_${m}_info">${monthData.date} ${monthData.method}</td>
        <td>
          <button onclick="markPaid('${studentId}','${m}')">Mark Paid</button>
          <button onclick="markBreak('${studentId}','${m}')">Mark Break</button>
          <button onclick="undo('${studentId}','${m}')">Undo</button>
        </td>
      </tr>`;
    });
    tuitionDiv.innerHTML = table + "</table>";
    classContent.appendChild(tuitionDiv);
  });
}

// ---------------- Tuition Actions ----------------
window.markPaid = (studentId, month) => {
  const date = new Date().toLocaleDateString();
  const method = prompt("Enter payment method:");
  if(!method) return;
  set(ref(db, `tuition/${studentId}/${month}`), {status:"Paid", date, method});
}

window.markBreak = (studentId, month) => {
  set(ref(db, `tuition/${studentId}/${month}`), {status:"Break", date:"", method:""});
}

window.undo = (studentId, month) => {
  set(ref(db, `tuition/${studentId}/${month}`), {status:"Unpaid", date:"", method:""});
}
