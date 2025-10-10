import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.appspot.com",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();
const studentId = localStorage.getItem("studentId");

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(()=>window.location.href="index.html");
});

// Tab switching
window.showTab = (tabName) => {
  ["home","profile","tuition","break"].forEach(t=>{
    document.getElementById(t).style.display = (t===tabName)?"block":"none";
  });
};

// Load profile
async function loadProfile(){
  const snapshot = await get(ref(db, `registrations/${studentId}`));
  if(snapshot.exists()){
    const data = snapshot.val();
    document.getElementById("profileName").innerText = data.name;
    document.getElementById("profileClass").innerText = data.class;
    document.getElementById("profileRoll").innerText = data.roll;
    document.getElementById("profileWhatsApp").innerText = data.whatsapp;
  }
}

// Load tuition table
function loadTuition(){
  const table = document.getElementById("tuitionTable");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();
  table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date | Method</th></tr>`;

  const tuitionRef = ref(db, `tuition/${studentId}`);
  onValue(tuitionRef, snapshot=>{
    const data = snapshot.val() || {};
    table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date | Method</th></tr>`;
    for(let i=0;i<=currentMonth;i++){
      const month = months[i];
      const row = table.insertRow();
      row.insertCell().innerText = month;
      let status = "Unpaid", color="red", dateMethod="";
      if(data[month]){
        status = data[month].status;
        dateMethod = data[month].date ? `${data[month].date} | ${data[month].method}` : "";
        if(status==="Paid") color="green";
        if(status==="Break") color="purple";
      }
      row.insertCell().innerHTML = `<span style="color:${color}">${status}</span>`;
      row.insertCell().innerText = dateMethod;
    }
  });
}

// Break requests
const breakContainer = document.getElementById("breakRequestContainer");
const submitBreakBtn = document.getElementById("submitBreakRequest");
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const todayMonth = new Date().getMonth();

for(let i=todayMonth+1;i<12;i++){
  const month = months[i];
  const checkbox = document.createElement("input");
  checkbox.type="checkbox";
  checkbox.id=month;
  const label = document.createElement("label");
  label.htmlFor=month;
  label.innerText = month;
  breakContainer.appendChild(checkbox);
  breakContainer.appendChild(label);
  breakContainer.appendChild(document.createElement("br"));
}

submitBreakBtn.addEventListener("click", async ()=>{
  const selected = [];
  months.forEach((month,i)=>{
    if(i>todayMonth){
      const cb = document.getElementById(month);
      if(cb.checked) selected.push(month);
    }
  });
  for(const month of selected){
    await set(ref(db, `breakRequests/${studentId}/${month}`), true);
  }
  alert("Break request submitted!");
});

loadProfile();
loadTuition();
