import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
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

// Initialize Firebase
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

// ------------------ Registration Requests ------------------
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
  loadRegistrations();
};
window.denyStudent = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved:false});
  loadRegistrations();
};

// ------------------ Break Requests ------------------
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
  loadBreakRequests();
};

// ------------------ Classes & Students ------------------
function createClassTabs() {
  const classTabsContainer = document.getElementById("classTabs");
  classTabsContainer.innerHTML = "";
  
  for(let i = 6; i <= 12; i++){
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
        div.innerHTML = `${student.name} (ID: ${studentId}, WhatsApp: ${student.whatsapp}) 
        <button onclick="manageTuition('${studentId}')">Tuition</button>`;
        container.appendChild(div);
      }
    });
  }
}

// Navigate to tuition management
window.manageTuition = (studentId) => {
  localStorage.setItem("currentStudentId", studentId);
  window.location.href = "tuitionPanel.html";
};

// ------------------ Initialize ------------------
createClassTabs();
loadRegistrations();
loadBreakRequests();
