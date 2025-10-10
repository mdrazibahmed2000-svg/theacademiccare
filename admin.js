import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href="index.html");
});

// Tab switching
window.showTab = (tabName) => {
  ["home","classes","registrations","breaks"].forEach(t=>{
    document.getElementById(t).style.display = (t===tabName)?"block":"none";
  });
};

// Load registration requests
async function loadRegistrations() {
  const snapshot = await get(ref(db, 'registrations'));
  const container = document.getElementById("registrationRequests");
  container.innerHTML = "";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const student = snapshot.val()[studentId];
      if(!student.approved){
        const div = document.createElement("div");
        div.innerHTML = `${student.name} (Class ${student.class}, Roll ${student.roll}) 
        <button onclick="approveStudent('${studentId}')">Approve</button>
        <button onclick="denyStudent('${studentId}')">Deny</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.approveStudent = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved:true});
};
window.denyStudent = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved:false});
};

// Break requests
async function loadBreakRequests() {
  const snapshot = await get(ref(db, 'breakRequests'));
  const container = document.getElementById("breakRequestsContainer");
  container.innerHTML = "";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const months = Object.keys(snapshot.val()[studentId]);
      if(months.length > 0){
        const div = document.createElement("div");
        div.innerHTML = `${studentId}: ${months.join(", ")} 
        <button onclick="resolveBreak('${studentId}')">Resolve</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.resolveBreak = async (studentId) => {
  await update(ref(db, `breakRequests/${studentId}`), {});
};

// Classes tab & students
function createClassTabs() {
  const classTabsContainer = document.getElementById("classTabs");
  classTabsContainer.innerHTML = "";
  for(let i=6; i<=12; i++){
    const btn = document.createElement("button");
    btn.innerText = `Class ${i}`;
    btn.addEventListener("click", () => loadClassStudents(i));
    classTabsContainer.appendChild(btn);
  }
}

// Load students and tuition table
async function loadClassStudents(classNum){
  const snapshot = await get(ref(db, 'registrations'));
  const container = document.getElementById("classStudents");
  container.innerHTML = `<h4>Class ${classNum}</h4>`;
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const student = snapshot.val()[studentId];
      if(student.approved && student.class == classNum){
        const studentDiv = document.createElement("div");
        studentDiv.id = `student-${studentId}`;
        studentDiv.innerHTML = `
          <strong>${student.name}</strong> (ID: ${studentId}, WhatsApp: ${student.whatsapp})
          <button onclick="openTuition('${studentId}')">Tuition Status</button>
          <div id="tuitionTable-${studentId}" style="margin-top:10px;"></div>
        `;
        container.appendChild(studentDiv);
      }
    });
  }
}

// Tuition Table
window.openTuition = async (studentId) => {
  const tuitionDiv = document.getElementById(`tuitionTable-${studentId}`);
  tuitionDiv.innerHTML = "";
  const table = document.createElement("table");
  table.border = "1";
  const header = table.insertRow();
  ["Month","Status","Date & Method","Action"].forEach(text=>{
    const th = document.createElement("th");
    th.innerText = text;
    header.appendChild(th);
  });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth(); // 0-11

  const tuitionRef = ref(db, `tuition/${studentId}`);
  const snapshot = await get(tuitionRef);
  const tuitionData = snapshot.exists() ? snapshot.val() : {};

  for(let i=0;i<=currentMonth;i++){
    const month = months[i];
    const row = table.insertRow();
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

    const actionCell = row.insertCell();
    if(!tuitionData[month] || tuitionData[month].status==="Unpaid"){
      const btnPaid = document.createElement("button");
      btnPaid.innerText = "Mark Paid";
      btnPaid.onclick = async ()=>{
        const method = prompt("Enter payment method:");
        if(method){
          await update(ref(db, `tuition/${studentId}/${month}`), {
            status:"Paid",
            date: new Date().toLocaleDateString(),
            method
          });
        }
      };
      const btnBreak = document.createElement("button");
      btnBreak.innerText = "Mark Break";
      btnBreak.onclick = async ()=>{
        await update(ref(db, `tuition/${studentId}/${month}`), {status:"Break", date:"", method:""});
      };
      actionCell.appendChild(btnPaid);
      actionCell.appendChild(btnBreak);
    } else {
      const undoBtn = document.createElement("button");
      undoBtn.innerText = "Undo";
      undoBtn.onclick = async ()=>{
        await update(ref(db, `tuition/${studentId}/${month}`), {status:"Unpaid", date:"", method:""});
      };
      actionCell.appendChild(undoBtn);
    }
  }

  tuitionDiv.appendChild(table);

  // Real-time refresh
  onValue(tuitionRef, snap=>{
    openTuition(studentId);
  });
};

// Initialize
createClassTabs();
loadRegistrations();
loadBreakRequests();
