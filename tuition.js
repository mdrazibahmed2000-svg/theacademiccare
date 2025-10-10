import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

const studentId = localStorage.getItem("currentStudentId");
document.getElementById("currentStudentId").innerText = studentId;

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "adminPanel.html";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(()=> window.location.href="index.html");
});

async function loadTuition(){
  const snapshot = await get(ref(db, `tuition/${studentId}`));
  const table = document.getElementById("tuitionTable");
  table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date | Method</th><th>Action</th></tr>`;

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const todayMonth = new Date().getMonth();

  months.forEach((month,i)=>{
    const status = snapshot.val()?.[month]?.status || "";
    const date = snapshot.val()?.[month]?.date || "";
    const method = snapshot.val()?.[month]?.method || "";

    let action = "";
    if(!status && i<=todayMonth){
      action = `<button onclick="markPaid('${month}')">Mark Paid</button> <button onclick="markBreak('${month}')">Mark Break</button>`;
    } else if(status){
      action = `<button onclick="undoStatus('${month}')">Undo</button>`;
    }

    table.innerHTML += `<tr>
      <td>${month}</td>
      <td>${status}</td>
      <td>${date} | ${method}</td>
      <td>${action}</td>
    </tr>`;
  });
}

window.markPaid = async (month)=>{
  const method = prompt("Enter payment method:");
  if(!method) return;
  const date = new Date().toLocaleDateString();
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Paid", date, method});
  loadTuition();
}

window.markBreak = async (month)=>{
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Break", date:"", method:""});
  loadTuition();
}

window.undoStatus = async (month)=>{
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"", date:"", method:""});
  loadTuition();
}

loadTuition();
