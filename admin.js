import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ---------------- Tabs ----------------
const sections = {
  home: document.getElementById("homeSection"),
  class: document.getElementById("classSection"),
  registration: document.getElementById("registrationSection"),
  break: document.getElementById("breakSection")
};

function hideAll(){ Object.values(sections).forEach(s=>s.style.display="none"); }

document.getElementById("homeTab").addEventListener("click", ()=>{ hideAll(); sections.home.style.display="block"; });
document.getElementById("classTab").addEventListener("click", ()=>{ hideAll(); sections.class.style.display="block"; loadClasses(); });
document.getElementById("registrationTab").addEventListener("click", ()=>{ hideAll(); sections.registration.style.display="block"; loadRegistrations(); });
document.getElementById("breakTab").addEventListener("click", ()=>{ hideAll(); sections.break.style.display="block"; loadBreakRequests(); });
document.getElementById("logoutBtn").addEventListener("click", ()=>{ signOut(auth).then(()=>window.location.href="index.html"); });

// ---------------- Load Classes ----------------
function loadClasses(){
  const classSubTabs = document.getElementById("classSubTabs");
  classSubTabs.innerHTML="";
  for(let i=6;i<=12;i++){
    const btn = document.createElement("button");
    btn.textContent = `Class ${i}`;
    btn.dataset.cls = i;
    btn.addEventListener("click", ()=> loadClassContent(i));
    classSubTabs.appendChild(btn);
  }
}

// ---------------- Load Students in Class ----------------
function loadClassContent(cls){
  const content = document.getElementById("classContent");
  content.innerHTML=`<h4>Class ${cls}</h4>`;
  const table = document.createElement("table");
  table.innerHTML="<tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition</th></tr>";
  content.appendChild(table);

  const studentsRef = ref(db,"students");
  onValue(studentsRef,snap=>{
    table.innerHTML="<tr><th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition</th></tr>";
    snap.forEach(child=>{
      const s = child.val();
      if(s.class==cls && s.status==="approved"){
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.name}</td><td>${s.studentId}</td><td>${s.whatsapp}</td>
        <td><button class="tuitionBtn" data-id="${s.studentId}">Manage</button></td>`;
        table.appendChild(tr);
      }
    });
    // Tuition button click
    document.querySelectorAll(".tuitionBtn").forEach(btn=>{
      btn.addEventListener("click", ()=> manageTuition(btn.dataset.id));
    });
  });
}

// ---------------- Tuition Management ----------------
function manageTuition(studentId){
  const content = document.getElementById("classContent");
  content.innerHTML=`<h4>Tuition Management: ${studentId}</h4>`;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const table = document.createElement("table");
  table.innerHTML="<tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>";
  content.appendChild(table);

  const tRef = ref(db,`tuition/${studentId}`);
  onValue(tRef, snap=>{
    table.innerHTML="<tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>";
    const todayMonth=new Date().getMonth();
    for(let i=0;i<=todayMonth;i++){
      const m=months[i];
      const mData=snap.exists()&&snap.val()[m]?snap.val()[m]:{status:"Unpaid",date:"",method:""};
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m}</td><td class="status">${mData.status}</td><td>${mData.date} ${mData.method}</td>
      <td>
        <button class="markPaid">Mark Paid</button>
        <button class="markBreak">Mark Break</button>
        <button class="undo" style="display:none;">Undo</button>
      </td>`;
      table.appendChild(tr);

      tr.querySelector(".markPaid").addEventListener("click", ()=>{
        const date = new Date().toLocaleDateString();
        const method = prompt("Payment method?");
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Paid",date,method});
      });
      tr.querySelector(".markBreak").addEventListener("click", ()=>{
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Break",date:"",method:""});
      });
      tr.querySelector(".undo").addEventListener("click", ()=>{
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Unpaid",date:"",method:""});
      });
    }
  });
}

// ---------------- Registration Requests ----------------
function loadRegistrations(){
  const container=document.getElementById("registrationRequests");
  container.innerHTML="";
  const studentsRef=ref(db,"students");
  onValue(studentsRef,snap=>{
    container.innerHTML="";
    snap.forEach(child=>{
      const s=child.val();
      if(s.status==="pending"){
        const div=document.createElement("div");
        div.innerHTML=`${s.name} (${s.studentId}) - <button class="approve">Approve</button> <button class="deny">Deny</button>`;
        container.appendChild(div);

        div.querySelector(".approve").addEventListener("click", ()=> update(ref(db,`students/${s.studentId}`),{status:"approved"}));
        div.querySelector(".deny").addEventListener("click", ()=> remove(ref(db,`students/${s.studentId}`)));
      }
    });
  });
}

// ---------------- Break Requests ----------------
function loadBreakRequests(){
  const container=document.getElementById("breakRequests");
  container.innerHTML="";
  const brRef = ref(db,"breakRequests");
  onValue(brRef,snap=>{
    container.innerHTML="";
    snap.forEach(studentSnap=>{
      const studentId = studentSnap.key;
      studentSnap.forEach(monthSnap=>{
        const monthData = monthSnap.val();
        if(monthData.status==="pending"){
          const div=document.createElement("div");
          div.innerHTML=`${studentId} - ${monthData.month} <button class="approve">Approve</button> <button class="deny">Deny</button>`;
          container.appendChild(div);

          div.querySelector(".approve").addEventListener("click", ()=>{
            update(ref(db,`tuition/${studentId}/${monthData.month}`),{status:"Break"});
            update(ref(db,`breakRequests/${studentId}/${monthSnap.key}`),{status:"approved"});
          });
          div.querySelector(".deny").addEventListener("click", ()=>{
            update(ref(db,`breakRequests/${studentId}/${monthSnap.key}`),{status:"denied"});
          });
        }
      });
    });
  });
}
