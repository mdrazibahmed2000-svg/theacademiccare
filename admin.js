import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href="index.html");
});

// Tab switching
window.showTab = (tabName) => {
  ["home","classes","registrations","breaks"].forEach(t=>{
    document.getElementById(t).style.display = (t===tabName)?"block":"none";
  });
};

// Load registrations
async function loadRegistrations() {
  const snapshot = await get(ref(db, 'registrations'));
  const container = document.getElementById("registrationRequests");
  container.innerHTML = "";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const student = snapshot.val()[studentId];
      if(!student.approved){
        const div = document.createElement("div");
        div.innerHTML = `${student.name} (Class ${student.class}, Roll ${student.roll}) 
        <button onclick="approveStudent('${studentId}')">Approve</button>
        <button onclick="denyStudent('${studentId}')">Deny</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.approveStudent = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved:true});
};
window.denyStudent = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved:false});
};

// Break requests
async function loadBreakRequests() {
  const snapshot = await get(ref(db, 'breakRequests'));
  const container = document.getElementById("breakRequestsContainer");
  container.innerHTML = "";
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const months = Object.keys(snapshot.val()[studentId]);
      if(months.length > 0){
        const div = document.createElement("div");
        div.innerHTML = `${studentId}: ${months.join(", ")} <button onclick="resolveBreak('${studentId}')">Resolve</button>`;
        container.appendChild(div);
      }
    });
  }
}
window.resolveBreak = async (studentId) => {
  await update(ref(db, `breakRequests/${studentId}`), {});
};

// Classes
function createClassTabs() {
  const classTabsContainer = document.getElementById("classTabs");
  classTabsContainer.innerHTML = "";
  for(let i=6; i<=12; i++){
    const btn = document.createElement("button");
    btn.innerText = `Class ${i}`;
    btn.addEventListener("click", () => loadClassStudents(i));
    classTabsContainer.appendChild(btn);
  }
}

async function loadClassStudents(classNum){
  const snapshot = await get(ref(db, 'registrations'));
  const container = document.getElementById("classStudents");
  container.innerHTML = `<h4>Class ${classNum}</h4>`;
  if(snapshot.exists()){
    Object.keys(snapshot.val()).forEach(studentId => {
      const student = snapshot.val()[studentId];
      if(student.approved && student.class == classNum){
        const div = document.createElement("div");
        div.id = `student-${studentId}`;
        div.innerHTML = `${student.name} (ID: ${studentId}, WhatsApp: ${student.whatsapp}) 
        <button onclick="markPaid('${studentId}')">Mark Paid</button>
        <button onclick="markBreak('${studentId}')">Mark Break</button>
        <span id="status-${studentId}"></span>`;
        container.appendChild(div);

        // Real-time status listener
        const tuitionRef = ref(db, `tuition/${studentId}`);
        onValue(tuitionRef, (snap)=>{
          const data = snap.val();
          if(data){
            const months = Object.keys(data);
            let statusHTML = "";
            months.forEach(month=>{
              statusHTML += `${month}: ${data[month].status} | `;
            });
            document.getElementById(`status-${studentId}`).innerText = statusHTML;
          } else {
            document.getElementById(`status-${studentId}`).innerText = "";
          }
        });
      }
    });
  }
}

// Mark Paid
window.markPaid = async (studentId) => {
  const month = prompt("Enter month to mark Paid:");
  const method = prompt("Enter payment method:");
  if(month && method){
    await update(ref(db, `tuition/${studentId}/${month}`), {
      status: "Paid",
      date: new Date().toLocaleDateString(),
      method
    });
  }
};

// Mark Break
window.markBreak = async (studentId) => {
  const month = prompt("Enter month to mark Break:");
  if(month){
    await update(ref(db, `tuition/${studentId}/${month}`), {
      status: "Break",
      date: "",
      method: ""
    });
  }
};

// Initialize
createClassTabs();
loadRegistrations();
loadBreakRequests();
