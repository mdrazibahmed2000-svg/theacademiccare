import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update, onChildChanged, onChildAdded, push, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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
  signOut(auth).then(()=> window.location.href="index.html");
});

// ------------------ Tab Switching ------------------
window.showTab = (tabName) => {
  ["home","classes","registrations","breaks"].forEach(t=>{
    document.getElementById(t).style.display = (t===tabName)?"block":"none";
  });
};

// ------------------ Create Class Sub-tabs ------------------
function createClassTabs() {
  const classTabsContainer = document.getElementById("classTabs");
  classTabsContainer.innerHTML = "";
  for(let i=6;i<=12;i++){
    const btn = document.createElement("button");
    btn.innerText = `Class ${i}`;
    btn.addEventListener("click", ()=> loadClassStudents(i));
    classTabsContainer.appendChild(btn);
  }
}
createClassTabs();

// ------------------ Load Students by Class ------------------
async function loadClassStudents(classNum){
  const container = document.getElementById("classStudents");
  container.innerHTML = "";
  const snapshot = await get(ref(db,'registrations'));
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId=>{
      const student = snapshot.val()[studentId];
      if(student.approved && parseInt(student.class) === classNum){
        createStudentRow(studentId, student);
      }
    });
  }
}

// ------------------ Create Student Row ------------------
function createStudentRow(studentId, student){
  const container = document.getElementById("classStudents");
  const div = document.createElement("div");
  div.id = `student-${studentId}`;
  div.style.marginBottom="10px";
  div.innerHTML = `
    <strong>${student.name}</strong> (ID: ${studentId}, WhatsApp: ${student.whatsapp})
    <button onclick="openTuition('${studentId}')">Tuition Status</button>
    <div id="tuitionTable-${studentId}" style="margin-top:10px;"></div>
  `;
  container.appendChild(div);
}

// ------------------ Tuition Table ------------------
window.openTuition = async (studentId)=>{
  const tuitionDiv = document.getElementById(`tuitionTable-${studentId}`);
  tuitionDiv.innerHTML="";
  const table = document.createElement("table");
  table.border="1"; table.style.width="100%";
  const header = table.insertRow();
  ["Month","Status","Date & Method","Action"].forEach(h=>{
    const th = document.createElement("th");
    th.innerText=h;
    header.appendChild(th);
  });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();
  const tuitionRef = ref(db, `tuition/${studentId}`);
  const snapshot = await get(tuitionRef);
  const tuitionData = snapshot.exists()? snapshot.val() : {};

  for(let i=0;i<=currentMonth;i++){
    const month = months[i];
    const row = table.insertRow(); row.setAttribute("data-month", month);
    row.insertCell().innerText = month;

    let status="Unpaid", color="red", dateMethod="";
    if(tuitionData[month]){
      status = tuitionData[month].status;
      dateMethod = tuitionData[month].date ? `${tuitionData[month].date} | ${tuitionData[month].method}` : "";
      if(status==="Paid") color="green"; if(status==="Break") color="purple";
    }

    row.insertCell().innerHTML=`<span style="color:${color}">${status}</span>`;
    row.insertCell().innerText=dateMethod;

    const actionCell = row.insertCell();
    if(!tuitionData[month] || tuitionData[month].status==="Unpaid"){
      const btnPaid=document.createElement("button");
      btnPaid.innerText="Mark Paid"; btnPaid.onclick=()=>markPaid(studentId, month);
      const btnBreak=document.createElement("button");
      btnBreak.innerText="Mark Break"; btnBreak.onclick=()=>markBreak(studentId, month);
      actionCell.appendChild(btnPaid); actionCell.appendChild(btnBreak);
    } else {
      const undoBtn=document.createElement("button");
      undoBtn.innerText="Undo"; undoBtn.onclick=()=>undoPayment(studentId, month);
      actionCell.appendChild(undoBtn);
    }
  }
  tuitionDiv.appendChild(table);

  // ------------------ Real-time Updates ------------------
  onChildChanged(tuitionRef, snap=>{
    const month=snap.key, data=snap.val();
    const row=table.querySelector(`tr[data-month="${month}"]`);
    if(row){
      row.cells[1].innerHTML=`<span style="color:${data.status==="Paid"?"green":data.status==="Break"?"purple":"red"}">${data.status}</span>`;
      row.cells[2].innerText=data.date ? `${data.date} | ${data.method}`:"";
      row.cells[3].innerHTML="";
      if(data.status==="Unpaid"){
        const btnPaid=document.createElement("button");
        btnPaid.innerText="Mark Paid"; btnPaid.onclick=()=>markPaid(studentId, month);
        const btnBreak=document.createElement("button");
        btnBreak.innerText="Mark Break"; btnBreak.onclick=()=>markBreak(studentId, month);
        row.cells[3].appendChild(btnPaid); row.cells[3].appendChild(btnBreak);
      } else {
        const undoBtn=document.createElement("button");
        undoBtn.innerText="Undo"; undoBtn.onclick=()=>undoPayment(studentId, month);
        row.cells[3].appendChild(undoBtn);
      }
    }
  });
}

// ------------------ Tuition Actions ------------------
async function markPaid(studentId, month){
  const method = prompt("Enter payment method:");
  if(method){
    await update(ref(db, `tuition/${studentId}/${month}`), {
      status:"Paid", date: new Date().toLocaleDateString(), method
    });
  }
}
async function markBreak(studentId, month){
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Break", date:"", method:""});
}
async function undoPayment(studentId, month){
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Unpaid", date:"", method:""});
}

// ------------------ Registration Requests ------------------
async function loadRegistrations(){
  const snapshot=await get(ref(db,'registrations'));
  const container=document.getElementById("registrationRequests"); container.innerHTML="";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId=>{
      const student=snapshot.val()[studentId];
      if(!student.approved){
        const div=document.createElement("div");
        div.innerHTML=`${student.name} (Class ${student.class}, Roll ${student.roll}) 
          <button onclick="approveStudent('${studentId}')">Approve</button>
          <button onclick="denyStudent('${studentId}')">Deny</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.approveStudent=async (studentId)=>{ await update(ref(db, `registrations/${studentId}`), {approved:true}); loadClassStudents(parseInt(await get(ref(db, `registrations/${studentId}/class`)).then(s=>s.val()))); loadRegistrations(); };
window.denyStudent=async (studentId)=>{ await update(ref(db, `registrations/${studentId}`), {approved:false}); loadRegistrations(); };

// ------------------ Break Requests ------------------
async function loadBreakRequests(){
  const snapshot=await get(ref(db,'breakRequests'));
  const container=document.getElementById("breakRequestsContainer"); container.innerHTML="";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId=>{
      const months=Object.values(snapshot.val()[studentId]);
      if(months.length>0){
        const div=document.createElement("div");
        div.innerHTML=`${studentId}: ${months.join(", ")} 
          <button onclick="resolveBreak('${studentId}')">Resolve</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.resolveBreak=async (studentId)=>{ await remove(ref(db, `breakRequests/${studentId}`)); loadBreakRequests(); };

// ------------------ Initialize ------------------
loadRegistrations(); loadBreakRequests();
