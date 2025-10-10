// admin.js
import { getDatabase, ref, get, update, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { logout } from "./script.js";

const db = getDatabase();

// Load all registration requests
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
        <button onclick="openTuition('${studentId}')">Manage Tuition</button>
      `;
      container.appendChild(div);
    }
  }
}

// Open tuition management panel for a student
window.openTuition = async (studentId) => {
  localStorage.setItem("currentStudentId", studentId);
  window.location.href = "tuitionPanel.html"; // Load tuition panel page
}

// Mark Paid / Break in tuitionPanel.html
export async function loadTuitionAdmin(studentId){
  const snapshot = await get(ref(db, `tuition/${studentId}`));
  const tuition = snapshot.val() || {};
  const container = document.getElementById("tuitionTable");
  container.innerHTML = "";

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const todayMonth = new Date().getMonth();

  monthNames.forEach((month,i) => {
    const status = tuition[month]?.status || "";
    const date = tuition[month]?.date || "";
    const method = tuition[month]?.method || "";

    let actionButtons = "";
    if(!status && i <= todayMonth){
      actionButtons = `<button onclick="markPaid('${studentId}','${month}')">Mark Paid</button>
                       <button onclick="markBreak('${studentId}','${month}')">Mark Break</button>`;
    } else if(status){
      actionButtons = `<button onclick="undoStatus('${studentId}','${month}')">Undo</button>`;
    }

    container.innerHTML += `<tr>
      <td>${month}</td>
      <td>${status}</td>
      <td>${date} | ${method}</td>
      <td>${actionButtons}</td>
    </tr>`;
  });
}

// Functions for marking tuition
window.markPaid = async (studentId, month) => {
  const method = prompt("Enter Payment Method:");
  if(!method) return;
  const date = new Date().toLocaleDateString();
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Paid", date:date, method:method});
  loadTuitionAdmin(studentId);
}

window.markBreak = async (studentId, month) => {
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"Break", date:"", method:""});
  loadTuitionAdmin(studentId);
}

window.undoStatus = async (studentId, month) => {
  await update(ref(db, `tuition/${studentId}/${month}`), {status:"", date:"", method:""});
  loadTuitionAdmin(studentId);
}

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", logout);

// Initial load
loadRegistrations();
for(let i=6;i<=12;i++){
  loadClassStudents(i);
}
