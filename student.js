import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase config
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

// Get studentId from URL
const params = new URLSearchParams(window.location.search);
const studentId = params.get("studentId");

// Tabs
const sections = {
  home: document.getElementById("homeSection"),
  profile: document.getElementById("profileSection"),
  tuition: document.getElementById("tuitionSection"),
  break: document.getElementById("breakSection")
};

function hideAll(){ Object.values(sections).forEach(s=>s.style.display="none"); }

document.getElementById("homeTab").addEventListener("click", ()=>{ hideAll(); sections.home.style.display="block"; });
document.getElementById("profileTab").addEventListener("click", ()=>{ hideAll(); sections.profile.style.display="block"; loadProfile(); });
document.getElementById("tuitionTab").addEventListener("click", ()=>{ hideAll(); sections.tuition.style.display="block"; loadTuition(); });
document.getElementById("breakTab").addEventListener("click", ()=>{ hideAll(); sections.break.style.display="block"; loadBreakRequests(); });
document.getElementById("logoutBtn").addEventListener("click", ()=>{ signOut(auth).then(()=>window.location.href="index.html"); });

// ---------------- Load Profile ----------------
function loadProfile(){
  const profileRef = ref(db,`students/${studentId}`);
  onValue(profileRef,snap=>{
    if(snap.exists()){
      const s = snap.val();
      sections.profile.innerHTML = `
        <h3>My Profile</h3>
        <p>Name: ${s.name}</p>
        <p>Student ID: ${s.studentId}</p>
        <p>Class: ${s.class}</p>
        <p>Roll: ${s.roll}</p>
        <p>WhatsApp: ${s.whatsapp}</p>
      `;
    }
  });
}

// ---------------- Load Tuition ----------------
function loadTuition(){
  const tuitionRef = ref(db,`tuition/${studentId}`);
  const table = document.createElement("table");
  table.innerHTML="<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>";
  sections.tuition.innerHTML="";
  sections.tuition.appendChild(table);

  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  onValue(tuitionRef, snap=>{
    table.innerHTML="<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>";
    const todayMonth = new Date().getMonth();
    for(let i=0;i<=todayMonth;i++){
      const m=months[i];
      const data=snap.val()&&snap.val()[m]?snap.val()[m]:{status:"Unpaid",date:"",method:""};
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m}</td><td>${data.status}</td><td>${data.date} ${data.method}</td>`;
      table.appendChild(tr);
    }
  });
}

// ---------------- Load Break Requests ----------------
function loadBreakRequests(){
  sections.break.innerHTML="<h3>Break Requests</h3>";
  const upcomingMonths=[];
  const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const currentMonth = new Date().getMonth();
  for(let i=currentMonth+1;i<12;i++) upcomingMonths.push(monthNames[i]);

  upcomingMonths.forEach(m=>{
    const div=document.createElement("div");
    div.innerHTML=`${m} <button class="requestBreak">Request Break</button>`;
    sections.break.appendChild(div);

    div.querySelector(".requestBreak").addEventListener("click", ()=>{
      push(ref(db,`breakRequests/${studentId}`),{month:m,status:"pending"});
      div.innerHTML=`${m} - Requested`;
    });
  });
}
