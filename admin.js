import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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

document.getElementById("logoutBtn").addEventListener("click", ()=>{
  signOut(auth).then(()=>window.location.href="index.html");
});

const studentList = document.getElementById("studentList");
const tuitionPanel = document.getElementById("tuitionPanel");
const classTabsContainer = document.getElementById("classTabs");
const registrationSection = document.getElementById("registrationSection");
const breakRequestSection = document.getElementById("breakRequestSection");

function hideAll(){ studentList.style.display="none"; tuitionPanel.style.display="none"; registrationSection.style.display="none"; breakRequestSection.style.display="none"; classTabsContainer.style.display="none"; }

document.getElementById("homeTab").addEventListener("click", hideAll);
document.getElementById("classTab").addEventListener("click", ()=>{
  hideAll();
  studentList.style.display="block";
  classTabsContainer.style.display="flex";
});
document.getElementById("registrationTab").addEventListener("click", ()=>{
  hideAll();
  registrationSection.style.display="block";
  loadRegistrationRequests();
});
document.getElementById("breakRequestTab").addEventListener("click", ()=>{
  hideAll();
  breakRequestSection.style.display="block";
  loadBreakRequests();
});

// Class sub-tabs 6-12
for(let i=6;i<=12;i++){
  const btn=document.createElement("button");
  btn.textContent=`Class ${i}`;
  btn.addEventListener("click",()=>loadClassStudents(i));
  classTabsContainer.appendChild(btn);
}

function loadClassStudents(classNumber){
  studentList.innerHTML=`<h3>Class ${classNumber}</h3>`;
  const studentRef=ref(db,"students");
  onValue(studentRef,(snapshot)=>{
    studentList.innerHTML=`<h3>Class ${classNumber}</h3>`;
    snapshot.forEach(child=>{
      const student=child.val();
      if(student.class==classNumber && student.status==="approved"){
        const div=document.createElement("div");
        div.className="student-card";
        div.innerHTML=`<p><strong>${student.name}</strong> (${student.studentId})</p>
                         <p>WhatsApp: ${student.whatsapp}</p>
                         <button class="tuition-btn" data-id="${student.studentId}">📘 Tuition Status</button>`;
        studentList.appendChild(div);
      }
    });
    document.querySelectorAll(".tuition-btn").forEach(btn=>{
      btn.addEventListener("click", e=> loadTuitionPanel(e.target.dataset.id));
    });
  },{onlyOnce:true});
}

function loadTuitionPanel(studentId){
  hideAll();
  tuitionPanel.style.display="block";
  tuitionPanel.innerHTML=`<h3>Tuition - ${studentId}</h3>`;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const table=document.createElement("table");
  table.className="tuition-table";
  table.innerHTML=`<tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>`;
  const tRef=ref(db,`tuition/${studentId}`);
  onValue(tRef,(snap)=>{
    table.innerHTML=`<tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>`;
    const todayMonth=new Date().getMonth();
    for(let i=0;i<=todayMonth;i++){
      const m=months[i];
      const mData=snap.exists() && snap.val()[m]?snap.val()[m]:{status:"Unpaid", date:"", method:""};
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m}</td><td class="status">${mData.status}</td><td>${mData.date} ${mData.method}</td>
                      <td>
                        <button class="markPaid">Mark Paid</button>
                        <button class="markBreak">Mark Break</button>
                        <button class="undo" style="display:none;">Undo</button>
                      </td>`;
      table.appendChild(tr);

      const markPaidBtn=tr.querySelector(".markPaid");
      const markBreakBtn=tr.querySelector(".markBreak");
      const undoBtn=tr.querySelector(".undo");

      markPaidBtn.addEventListener("click", ()=>{
        const date=new Date().toLocaleDateString();
        const method=prompt("Enter payment method");
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Paid",date,method});
        tr.querySelector(".status").textContent="Paid";
        markPaidBtn.style.display="none"; markBreakBtn.style.display="none"; undoBtn.style.display="inline";
      });
      markBreakBtn.addEventListener("click", ()=>{
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Break"});
        tr.querySelector(".status").textContent="Break";
        markPaidBtn.style.display="none"; markBreakBtn.style.display="none"; undoBtn.style.display="inline";
      });
      undoBtn.addEventListener("click", ()=>{
        update(ref(db,`tuition/${studentId}/${m}`),{status:"Unpaid",date:"",method:""});
        tr.querySelector(".status").textContent="Unpaid";
        markPaidBtn.style.display="inline"; markBreakBtn.style.display="inline"; undoBtn.style.display="none";
      });
    }
  },{onlyOnce:true});
}

// Registration Requests
function loadRegistrationRequests(){
  const container=document.getElementById("registrationList");
  const regRef=ref(db,"students");
  onValue(regRef,(snap)=>{
    container.innerHTML="";
    snap.forEach(child=>{
      const s=child.val();
      if(s.status==="pending"){
        const div=document.createElement("div");
        div.className="reg-card";
        div.innerHTML=`<p>${s.name} (${s.studentId}) - Class ${s.class}</p>
                        <p>WhatsApp: ${s.whatsapp}</p>
                        <button class="approveBtn" data-id="${s.studentId}">Approve</button>
                        <button class="denyBtn" data-id="${s.studentId}">Deny</button>`;
        container.appendChild(div);
      }
    });

    document.querySelectorAll(".approveBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const id=e.target.dataset.id;
        update(ref(db,`students/${id}`),{status:"approved"});
      });
    });
    document.querySelectorAll(".denyBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const id=e.target.dataset.id;
        remove(ref(db,`students/${id}`));
      });
    });
  });
}

// Break Requests
function loadBreakRequests(){
  const container=document.getElementById("breakList");
  const brRef=ref(db,"breakRequests");
  onValue(brRef,(snap)=>{
    container.innerHTML="";
    snap.forEach(child=>{
      const studentId=child.key;
      child.forEach(req=>{
        const r=req.val();
        if(r.status==="pending"){
          const div=document.createElement("div");
          div.innerHTML=`<p>${studentId} requested break for ${r.month}</p>
                         <button class="approveBreakBtn" data-student="${studentId}" data-key="${req.key}">Approve</button>
                         <button class="denyBreakBtn" data-student="${studentId}" data-key="${req.key}">Deny</button>`;
          container.appendChild(div);
        }
      });
    });

    document.querySelectorAll(".approveBreakBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const studentId=e.target.dataset.student;
        const key=e.target.dataset.key;
        update(ref(db,`breakRequests/${studentId}/${key}`),{status:"approved"});
      });
    });

    document.querySelectorAll(".denyBreakBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const studentId=e.target.dataset.student;
        const key=e.target.dataset.key;
        remove(ref(db,`breakRequests/${studentId}/${key}`));
      });
    });
  });
}
