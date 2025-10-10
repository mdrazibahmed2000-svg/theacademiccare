import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update, onChildChanged, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// ------------------ Logout ------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href="index.html");
});

// ------------------ Tab Switching ------------------
window.showTab = (tabName) => {
  ["home","profile","tuition","break"].forEach(t=>{
    document.getElementById(t).style.display = (t===tabName)?"block":"none";
  });
};

// ------------------ Load Profile ------------------
async function loadProfile(studentId){
  const snapshot = await get(ref(db, `registrations/${studentId}`));
  if(snapshot.exists()){
    const student = snapshot.val();
    const container = document.getElementById("profileInfo");
    container.innerHTML = `
      <p><strong>Name:</strong> ${student.name}</p>
      <p><strong>Class:</strong> ${student.class}</p>
      <p><strong>Roll:</strong> ${student.roll}</p>
      <p><strong>WhatsApp:</strong> ${student.whatsapp}</p>
    `;
  }
}

// ------------------ Load Tuition ------------------
async function loadTuition(studentId){
  const tuitionDiv = document.getElementById("tuitionTableContainer");
  tuitionDiv.innerHTML = "";
  const table = document.createElement("table");
  table.border = "1";
  table.style.width = "100%";

  const header = table.insertRow();
  ["Month","Status","Date & Method"].forEach(text=>{
    const th = document.createElement("th");
    th.innerText = text;
    header.appendChild(th);
  });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();

  const tuitionRef = ref(db, `tuition/${studentId}`);
  const snapshot = await get(tuitionRef);
  const tuitionData = snapshot.exists() ? snapshot.val() : {};

  for(let i=0;i<=currentMonth;i++){
    const month = months[i];
    const row = table.insertRow();
    row.setAttribute("data-month", month);
    row.insertCell().innerText = month;

    let status="Unpaid", color="red", dateMethod="";
    if(tuitionData[month]){
      status = tuitionData[month].status;
      dateMethod = tuitionData[month].date ? `${tuitionData[month].date} | ${tuitionData[month].method}` : "";
      if(status==="Paid") color="green";
      if(status==="Break") color="purple";
    }
    row.insertCell().innerHTML = `<span style="color:${color}">${status}</span>`;
    row.insertCell().innerText = dateMethod;
  }

  tuitionDiv.appendChild(table);

  // Real-time update listener
  onChildChanged(tuitionRef, (snap)=>{
    const month = snap.key;
    const data = snap.val();
    const row = table.querySelector(`tr[data-month="${month}"]`);
    if(row){
      row.cells[1].innerHTML = `<span style="color:${data.status==="Paid"?"green":data.status==="Break"?"purple":"red"}">${data.status}</span>`;
      row.cells[2].innerText = data.date ? `${data.date} | ${data.method}` : "";
    }
  });
}

// ------------------ Load Break Requests ------------------
async function loadBreakRequest(studentId){
  const breakDiv = document.getElementById("breakRequestContainer");
  breakDiv.innerHTML = "";
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();

  for(let i=currentMonth+1;i<12;i++){ // only upcoming months
    const month = months[i];
    const btn = document.createElement("button");
    btn.innerText = `Request Break: ${month}`;
    btn.addEventListener("click", async ()=>{
      await push(ref(db, `breakRequests/${studentId}`), month);
      alert(`Break requested for ${month}`);
    });
    breakDiv.appendChild(btn);
  }
}

// ------------------ Initialize Panel ------------------
window.initStudentPanel = (studentId) => {
  loadProfile(studentId);
  loadTuition(studentId);
  loadBreakRequest(studentId);
};
