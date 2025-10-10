import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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

// Get studentId from URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("studentId");

const homeSection = document.getElementById("homeSection");
const profileSection = document.getElementById("profileSection");
const tuitionSection = document.getElementById("tuitionSection");
const breakSection = document.getElementById("breakSection");

// ---------------- Tabs ----------------
function hideAll(){ 
  homeSection.style.display="none"; 
  profileSection.style.display="none"; 
  tuitionSection.style.display="none"; 
  breakSection.style.display="none"; 
}

document.getElementById("homeTab").addEventListener("click", ()=>{
  hideAll();
  homeSection.style.display="block";
});

document.getElementById("profileTab").addEventListener("click", ()=>{
  hideAll();
  profileSection.style.display="block";
  loadProfile();
});

document.getElementById("tuitionTab").addEventListener("click", ()=>{
  hideAll();
  tuitionSection.style.display="block";
  loadTuitionStatus();
});

document.getElementById("breakTab").addEventListener("click", ()=>{
  hideAll();
  breakSection.style.display="block";
  loadBreakRequest();
});

// ---------------- Logout ----------------
document.getElementById("logoutBtn").addEventListener("click", ()=>{
  signOut(auth).then(()=>window.location.href="index.html");
});

// ---------------- Load Profile ----------------
function loadProfile(){
  const studentRef = ref(db, `students/${studentId}`);
  onValue(studentRef, snap=>{
    if(snap.exists()){
      const s = snap.val();
      profileSection.innerHTML = `
        <h3>My Profile</h3>
        <p><strong>Name:</strong> ${s.name}</p>
        <p><strong>Class:</strong> ${s.class}</p>
        <p><strong>Roll:</strong> ${s.roll}</p>
        <p><strong>WhatsApp:</strong> ${s.whatsapp}</p>
        <p><strong>Student ID:</strong> ${s.studentId}</p>
      `;
    }
  }, {onlyOnce:true});
}

// ---------------- Tuition Fee Status ----------------
function loadTuitionStatus(){
  tuitionSection.innerHTML=`<h3>Tuition Fee Status</h3>`;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const table=document.createElement("table");
  table.className="tuition-table";
  table.innerHTML=`<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>`;
  tuitionSection.appendChild(table);

  const tRef = ref(db, `tuition/${studentId}`);
  onValue(tRef, snap=>{
    table.innerHTML=`<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>`;
    const todayMonth=new Date().getMonth();
    for(let i=0;i<=todayMonth;i++){
      const m=months[i];
      const mData=snap.exists() && snap.val()[m]?snap.val()[m]:{status:"Unpaid",date:"",method:""};
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m}</td><td>${mData.status}</td><td>${mData.date} ${mData.method}</td>`;
      table.appendChild(tr);
    }
  });
}

// ---------------- Break Request ----------------
function loadBreakRequest(){
  breakSection.innerHTML=`<h3>Request Break</h3>`;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const todayMonth=new Date().getMonth();
  const upcomingMonths = months.slice(todayMonth+1);
  const container=document.createElement("div");
  breakSection.appendChild(container);

  upcomingMonths.forEach(m=>{
    const btn=document.createElement("button");
    btn.textContent=m;
    btn.addEventListener("click", ()=>{
      const brRef = ref(db, `breakRequests/${studentId}`);
      push(brRef, {month:m,status:"pending"}).then(()=>alert(`Break requested for ${m}`));
    });
    container.appendChild(btn);
  });
}
