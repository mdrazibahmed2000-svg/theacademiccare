import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Firebase config
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// ------------------ TAB FUNCTIONS ------------------
function hideAllTabs() {
  document.querySelectorAll('.tabContent').forEach(tab => tab.style.display='none');
}

window.showTab = (tabId) => {
  hideAllTabs();
  document.getElementById(tabId).style.display = 'block';
  if(tabId==='classTab') loadClassStudents();
  if(tabId==='registrationTab') loadRegistrationRequests();
  if(tabId==='breakTab') loadBreakRequests();
}

// ------------------ SUB-TAB FUNCTIONS ------------------
function hideAllClassContent() {
  document.querySelectorAll('.classContent').forEach(div => div.style.display='none');
}

window.showClassSubTab = (cls) => {
  hideAllClassContent();
  document.getElementById('class'+cls).style.display='block';
}

// ------------------ REGISTRATION TAB ------------------
function loadRegistrationRequests() {
  const regDiv = document.getElementById('registrationList');
  regDiv.innerHTML = '';
  onValue(ref(db, 'students'), snapshot => {
    regDiv.innerHTML = '';
    snapshot.forEach(snap => {
      const student = snap.val();
      const id = snap.key;

      // Ensure missing fields are initialized
      if(student.approved===undefined) student.approved=false;
      if(student.denied===undefined) student.denied=false;

      if(!student.approved && !student.denied){
        const li = document.createElement('li');
        li.innerHTML = `
          ${student.name} (Class: ${student.class}, Roll: ${student.roll})
          <button onclick="approveStudent('${id}')">Approve</button>
          <button onclick="denyStudent('${id}')">Deny</button>
        `;
        regDiv.appendChild(li);
      }
    });
  });
}

window.approveStudent = (id) => {
  update(ref(db, 'students/' + id), { approved: true, denied:false });
  alert('Student approved!');
}

window.denyStudent = (id) => {
  update(ref(db, 'students/' + id), { denied: true, approved:false });
  alert('Student denied!');
}

// ------------------ CLASS TAB ------------------
function loadClassStudents() {
  for(let cls=6; cls<=12; cls++){
    const div = document.getElementById('class'+cls);
    div.innerHTML='Loading...';
    onValue(ref(db, 'students'), snapshot => {
      div.innerHTML = '';
      snapshot.forEach(snap => {
        const student = snap.val();
        const id = snap.key;

        // Initialize missing fields
        if(student.approved===undefined) student.approved=false;
        if(student.denied===undefined) student.denied=false;

        if(student.approved && !student.denied && student.class==cls){
          div.innerHTML += `
            <div>
              ${student.name} (ID: ${id}, WhatsApp: ${student.whatsapp})
              <button onclick="viewTuition('${id}')">Tuition Status</button>
            </div>
          `;
        }
      });
    });
  }
}

// ------------------ TUITION PANEL (OPEN FROM CLASS TAB) ------------------
window.viewTuition = (studentId) => {
  window.open(`tuitionPanel.html?studentId=${studentId}`, '_blank');
}

// ------------------ BREAK REQUESTS ------------------
function loadBreakRequests() {
  const breakDiv = document.getElementById('breakList');
  breakDiv.innerHTML = '';
  onValue(ref(db, 'tuition'), snapshot => {
    snapshot.forEach(studentSnap => {
      const studentId = studentSnap.key;
      const months = studentSnap.val();
      for(let m in months){
        if(months[m].status === 'Break' && !months[m].approved){
          const li = document.createElement('li');
          li.innerHTML = `
            Student: ${studentId}, Month: ${m}
            <button onclick="approveBreak('${studentId}','${m}')">Approve</button>
            <button onclick="denyBreak('${studentId}','${m}')">Deny</button>
          `;
          breakDiv.appendChild(li);
        }
      }
    });
  });
}

window.approveBreak = (studentId, month) => {
  update(ref(db, `tuition/${studentId}/${month}`), { approved:true });
  alert('Break approved!');
}

window.denyBreak = (studentId, month) => {
  update(ref(db, `tuition/${studentId}/${month}`), { approved:false, status:'Unpaid' });
  alert('Break denied!');
}

// ------------------ INITIALIZE ------------------
showTab('homeTab');
