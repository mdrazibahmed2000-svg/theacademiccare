import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// Load Registration Requests
function loadRegistrationRequests() {
  const regDiv = document.getElementById('registrationList');
  onValue(ref(db, 'students'), snapshot => {
    regDiv.innerHTML = '';
    snapshot.forEach(snap => {
      const student = snap.val();
      const id = snap.key;
      if(!student.approved){
        const li = document.createElement('li');
        li.innerHTML = `
          ${student.name} (ID: ${id}, Class: ${student.class})
          <button onclick="approveStudent('${id}',${student.class})">Approve</button>
          <button onclick="denyStudent('${id}')">Deny</button>
        `;
        regDiv.appendChild(li);
      }
    });
  });
}

// Approve / Deny
window.approveStudent = (id, studentClass) => {
  update(ref(db, 'students/' + id), { approved: true });
  alert('Student approved');
};

window.denyStudent = (id) => {
  update(ref(db, 'students/' + id), { denied: true });
  alert('Student denied');
};

// Load Class Students
function loadClassStudents() {
  for(let cls=6; cls<=12; cls++){
    const div = document.getElementById('class'+cls);
    onValue(ref(db, 'students'), snapshot => {
      div.innerHTML = '';
      snapshot.forEach(snap => {
        const student = snap.val();
        const id = snap.key;
        if(student.approved && student.class==cls){
          const tuitionIcon = `<button onclick="viewTuition('${id}')">Tuition Status</button>`;
          div.innerHTML += `<div>${student.name} (ID: ${id}, WhatsApp: ${student.whatsapp}) ${tuitionIcon}</div>`;
        }
      });
    });
  }
}

// Tuition Actions
window.viewTuition = (studentId) => {
  window.location.href = `tuitionPanel.html?studentId=${studentId}`;
};

window.markPaid = (studentId, month) => {
  const date = new Date().toLocaleDateString();
  const method = prompt('Enter payment method:');
  update(ref(db, `tuition/${studentId}/${month}`), { status:'Paid', date, method });
};

window.markBreak = (studentId, month) => {
  update(ref(db, `tuition/${studentId}/${month}`), { status:'Break' });
};

window.undoTuition = (studentId, month) => {
  update(ref(db, `tuition/${studentId}/${month}`), { status:'Unpaid', date:'', method:'' });
};

// Initialize
loadRegistrationRequests();
loadClassStudents();
