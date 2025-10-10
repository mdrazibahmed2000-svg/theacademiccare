import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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
document.getElementById("logoutBtnStudent").addEventListener("click", ()=>{
  signOut(auth).then(()=>window.location.href="index.html");
});

// ---------------- Tabs ----------------
const tabs = document.querySelectorAll(".studentTabBtn");
tabs.forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll("#studentTabContents .tabContent").forEach(tc => tc.style.display="none");
  document.getElementById(tab.dataset.tab).style.display="block";
}));

// ---------------- Load Student Data ----------------
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("studentId");

const myProfile = document.getElementById("myProfile");
const tuitionFee = document.getElementById("tuitionFee");
const breakRequest = document.getElementById("breakRequest");

get(ref(db, `students/${studentId}`)).then(snap=>{
  const student = snap.val();
  myProfile.innerHTML = `
    <p>Name: ${student.name}</p>
    <p>Class: ${student.class}</p>
    <p>Roll: ${student.roll}</p>
    <p>WhatsApp: ${student.whatsapp}</p>
    <p>Student ID: ${student.studentId}</p>
  `;
});

// ---------------- Load Tuition ----------------
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
onValue(ref(db, `tuition/${studentId}`), snap=>{
  let table = "<table border='1'><tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>";
  const today = new Date();
  months.forEach((m,i)=>{
    if(i <= today.getMonth()){ // only show up to current month
      const data = snap.val() && snap.val()[m] ? snap.val()[m] : {status:"Unpaid", date:"", method:""};
      table += `<tr>
        <td>${m}</td>
        <td>${data.status}</td>
        <td>${data.date} ${data.method}</td>
      </tr>`;
    }
  });
  table += "</table>";
  tuitionFee.innerHTML = table;
});

// ---------------- Break Request ----------------
let breakTable = "<table border='1'><tr><th>Month</th><th>Request</th></tr>";
months.forEach((m,i)=>{
  if(i > new Date().getMonth()){ // upcoming months
    breakTable += `<tr>
      <td>${m}</td>
      <td><button onclick="requestBreak('${m}')">Request Break</button></td>
    </tr>`;
  }
});
breakTable += "</table>";
breakRequest.innerHTML = breakTable;

window.requestBreak = (month)=>{
  update(ref(db, `breakRequests/${studentId}/${month}`), {status:"requested"});
  alert(`Break requested for ${month}`);
};
