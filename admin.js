// admin.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { logout } from "./script.js";

const db = getDatabase();

// Load all registrations for approval
export async function loadRegistrations(){
  const snapshot = await get(ref(db, "registrations"));
  const registrations = snapshot.val();
  const container = document.getElementById("registrationRequests");
  container.innerHTML = "";

  for(let studentId in registrations){
    const student = registrations[studentId];
    if(!student.approved){
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>${student.name}</strong> | Class: ${student.class} | Roll: ${student.roll} 
        <button onclick="approve('${studentId}')">Approve</button>
        <button onclick="deny('${studentId}')">Deny</button>
      `;
      container.appendChild(div);
    }
  }
}

// Approve student
window.approve = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved: true});
  alert(`${studentId} approved.`);
  loadRegistrations();
};

// Deny student
window.deny = async (studentId) => {
  await update(ref(db, `registrations/${studentId}`), {approved: false});
  alert(`${studentId} denied.`);
  loadRegistrations();
};

// Load approved students per class
export async function loadClassStudents(classNum){
  const snapshot = await get(ref(db, "registrations"));
  const students = snapshot.val();
  const container = document.getElementById(`class${classNum}`);
  container.innerHTML = "";

  for(let studentId in students){
    const student = students[studentId];
    if(student.approved && student.class === classNum.toString()){
      const div = document.createElement("div");
      div.innerHTML = `
        ${student.name} | ${studentId} | WhatsApp: ${student.whatsapp}
        <button onclick="manageTuition('${studentId}')">Tuition Status</button>
      `;
      container.appendChild(div);
    }
  }
}

// Manage tuition
window.manageTuition = async (studentId) => {
  // Example: open modal or new page for tuition management
  localStorage.setItem("currentStudentId", studentId);
  window.location.href = "tuitionPanel.html";
}

// Logout button
document.getElementById("logoutBtn")?.addEventListener("click", logout);

// Initial load
loadRegistrations();
for(let i=6;i<=12;i++){
  loadClassStudents(i);
}
