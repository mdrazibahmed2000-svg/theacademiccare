import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasedatabase.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const tabs = document.querySelectorAll('.tabBtn');
const contents = document.querySelectorAll('.tabContent');

tabs.forEach(tab => {
  tab.addEventListener('click', async () => {
    contents.forEach(c => c.style.display='none');
    document.getElementById(tab.dataset.tab).style.display='block';
    if(tab.dataset.tab==='registration') loadRegistrations();
    if(tab.dataset.tab==='class') loadClasses();
    if(tab.dataset.tab==='breakRequests') loadBreakRequests();
  });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth).then(()=>{window.location.href='index.html';});
});

async function loadRegistrations(){
  const container = document.getElementById('registration');
  container.innerHTML = '<h3>Student Registration Requests</h3>';
  const snapshot = await get(ref(db, 'students'));
  snapshot.forEach(childSnap => {
    const student = childSnap.val();
    if(!student.approved){
      const div = document.createElement('div');
      div.innerHTML = `
        <b>${student.studentId} - ${student.name}</b> WhatsApp: ${student.whatsapp}
        <button onclick="approve('${student.studentId}')">Approve</button>
        <button onclick="deny('${student.studentId}')">Deny</button>
      `;
      container.appendChild(div);
    }
  });
}

window.approve = async (studentId)=>{
  await update(ref(db, 'students/'+studentId), {approved:true});
  alert(studentId+' approved');
  loadRegistrations();
};
window.deny = async (studentId)=>{
  await update(ref(db, 'students/'+studentId), {approved:false});
  alert(studentId+' denied');
  loadRegistrations();
};

async function loadClasses(){
  const container = document.getElementById('class');
  container.innerHTML = '';
  for(let cls=6; cls<=12; cls++){
    const div = document.createElement('div');
    div.innerHTML = `<h4>Class ${cls}</h4>`;
    const ul = document.createElement('ul');
    const snapshot = await get(ref(db, 'students'));
    snapshot.forEach(childSnap=>{
      const student = childSnap.val();
      if(student.approved && parseInt(student.class)===cls){
        const li = document.createElement('li');
        li.innerHTML = `${student.studentId} - ${student.name} WhatsApp: ${student.whatsapp} 
        <button onclick="markPaid('${student.studentId}')">Mark Paid</button>
        <button onclick="markBreak('${student.studentId}')">Mark Break</button>`;
        ul.appendChild(li);
      }
    });
    div.appendChild(ul);
    container.appendChild(div);
  }
}

window.markPaid = async (studentId)=>{
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const updates = {};
  const nowMonth = new Date().getMonth();
  for(let i=0;i<=nowMonth;i++){
    updates[months[i]] = {status:'Paid', date:new Date().toISOString().slice(0,10), method:'Cash'};
  }
  await update(ref(db, 'tuition/'+studentId), updates);
  alert(studentId+' marked Paid');
};

window.markBreak = async (studentId)=>{
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const updates = {};
  const nowMonth = new Date().getMonth();
  for(let i=0;i<=nowMonth;i++){
    updates[months[i]] = {status:'Break', date:'', method:''};
  }
  await update(ref(db, 'tuition/'+studentId), updates);
  alert(studentId+' marked Break');
};

async function loadBreakRequests(){
  const container = document.getElementById('breakRequests');
  container.innerHTML = '<h3>Break Requests</h3>';
  const snapshot = await get(ref(db, 'breakRequests'));
  snapshot.forEach(childSnap=>{
    const studentId = childSnap.key;
    const months = childSnap.val();
    for(const month in months){
      if(months[month].requested){
        const div = document.createElement('div');
        div.innerHTML = `${studentId} - ${month} 
          <button onclick="approveBreak('${studentId}','${month}')">Approve</button>
          <button onclick="denyBreak('${studentId}','${month}')">Deny</button>`;
        container.appendChild(div);
      }
    }
  });
}

window.approveBreak = async (studentId, month)=>{
  await update(ref(db, 'breakRequests/'+studentId+'/'+month), {requested:false, approved:true});
  alert(studentId+' break approved for '+month);
  loadBreakRequests();
};
window.denyBreak = async (studentId, month)=>{
  await update(ref(db, 'breakRequests/'+studentId+'/'+month), {requested:false, approved:false});
  alert(studentId+' break denied for '+month);
  loadBreakRequests();
};
