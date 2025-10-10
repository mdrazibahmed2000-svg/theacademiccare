import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
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

// Get studentId from URL
const params = new URLSearchParams(window.location.search);
const studentId = params.get('studentId');

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// Load My Profile
function loadProfile() {
  onValue(ref(db, 'students/' + studentId), snapshot => {
    const student = snapshot.val();
    document.getElementById('profileInfo').innerHTML = `
      <p>Name: ${student.name}</p>
      <p>Class: ${student.class}</p>
      <p>Roll: ${student.roll}</p>
      <p>WhatsApp: ${student.whatsapp}</p>
      <p>Student ID: ${studentId}</p>
    `;
  });
}

// Load Tuition Fee Status
function loadTuition() {
  const tuitionDiv = document.getElementById('tuitionDiv');
  tuitionDiv.innerHTML = '<h3>Tuition Fee Status</h3>';

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  onValue(ref(db, 'tuition/' + studentId), snapshot => {
    const data = snapshot.val() || {};
    tuitionDiv.innerHTML = '<h3>Tuition Fee Status</h3>';

    months.forEach((m, idx)=>{
      if(idx <= new Date().getMonth()){ // only current and past months
        let status = 'Unpaid', date='', method='';
        if(data[m]){
          status = data[m].status;
          date = data[m].date || '';
          method = data[m].method || '';
        }

        // CSS class for color
        let statusClass = 'status-unpaid';
        if(status === 'Paid') statusClass = 'status-paid';
        else if(status === 'Break') statusClass = 'status-break';

        tuitionDiv.innerHTML += `
          <div>${m}: <span class="${statusClass}">${status}</span> ${date} ${method}</div>
        `;
      }
    });
  });
}

// Load Break Request Form
function loadBreakRequest() {
  const breakDiv = document.getElementById('breakDiv');
  breakDiv.innerHTML = '<h3>Break Request</h3>';

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  months.forEach((m, idx)=>{
    if(idx > new Date().getMonth()){ // upcoming months
      const btn = document.createElement('button');
      btn.textContent = 'Request Break for ' + m;
      btn.onclick = () => requestBreak(m);
      breakDiv.appendChild(btn);
    }
  });
}

// Request Break
function requestBreak(month){
  update(ref(db, `tuition/${studentId}/${month}`), { status:'Break' });
  alert('Break requested for ' + month);
}

// Initialize student panel
loadProfile();
loadTuition();
loadBreakRequest();
