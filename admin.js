// Initialize Firebase Database
const db = firebase.database();

// Admin Tabs
const tabs = document.querySelectorAll(".tab");
const subTabsContainer = document.getElementById("subTabs");
const studentsContainer = document.getElementById("studentsList");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    showTab(tabName);
  });
});

// Show Tab function
function showTab(tabName){
  subTabsContainer.innerHTML = "";
  studentsContainer.innerHTML = "";

  if(tabName === "Home"){
    // Only tabs visible
  } else if(tabName === "Class"){
    showClassSubTabs();
  } else if(tabName === "Registration"){
    showRegistrationRequests();
  } else if(tabName === "BreakRequest"){
    showBreakRequests();
  }
}

// Show Class SubTabs
function showClassSubTabs(){
  for(let i=6;i<=12;i++){
    const btn = document.createElement("button");
    btn.textContent = "Class " + i;
    btn.addEventListener("click",()=>showStudentsInClass(i));
    subTabsContainer.appendChild(btn);
  }
}

// Show Students in Class
function showStudentsInClass(classNo){
  studentsContainer.innerHTML = "";
  db.ref("students").orderByChild("class").equalTo(""+classNo).once("value", snap => {
    const data = snap.val();
    if(!data) return studentsContainer.innerHTML="No students in this class.";
    Object.keys(data).forEach(id=>{
      if(data[id].approved){
        const div = document.createElement("div");
        div.innerHTML = `
          <b>${data[id].name}</b> (${data[id].studentId}) | WhatsApp: ${data[id].whatsapp} 
          <button onclick="manageTuition('${id}')">Manage Tuition</button>
        `;
        studentsContainer.appendChild(div);
      }
    });
  });
}

// Manage Tuition Function
function manageTuition(studentId){
  const container = studentsContainer;
  container.innerHTML = `<h3>Tuition Management for ${studentId}</h3>`;

  const table = document.createElement("table");
  table.border = "1";
  table.style.width = "100%";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th>Month's Name</th>
    <th>Status</th>
    <th>Date & Method</th>
    <th>Action</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  container.appendChild(table);

  db.ref(`tuition/${studentId}`).once("value", snap => {
    const data = snap.val() || {};
    const months = Object.keys(data);
    months.forEach(month => {
      const tr = document.createElement("tr");
      const status = data[month].status || "Unpaid";
      const date = data[month].date || "";
      const method = data[month].method || "";

      let actionHTML = `
        <button onclick="markPaid('${studentId}','${month}')">Mark Paid</button>
        <button onclick="markBreak('${studentId}','${month}')">Mark Break</button>
      `;
      if(status === "Paid" || status === "Break") {
        actionHTML = `<button onclick="undoStatus('${studentId}','${month}')">Undo</button>`;
      }

      tr.innerHTML = `
        <td>${month}</td>
        <td style="color:${status==="Paid"?'green':status==="Break"?'purple':'red'}">${status}</td>
        <td>${date} ${method}</td>
        <td>${actionHTML}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Tuition Actions
function markPaid(studentId, month){
  const method = prompt("Enter Payment Method:");
  if(!method) return alert("Payment method is required!");
  const today = new Date().toISOString().split("T")[0];
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Paid",
    date: today,
    method: method
  }).then(()=> manageTuition(studentId));
}

function markBreak(studentId, month){
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Break",
    date: "",
    method: ""
  }).then(()=> manageTuition(studentId));
}

function undoStatus(studentId, month){
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Unpaid",
    date: "",
    method: ""
  }).then(()=> manageTuition(studentId));
}

// Show Registration Requests
function showRegistrationRequests(){
  studentsContainer.innerHTML="";
  db.ref("students").once("value", snap=>{
    const data = snap.val();
    if(!data) return studentsContainer.innerHTML="No registration requests.";
    Object.keys(data).forEach(id=>{
      const student = data[id];
      if(!student.approved){
        const div = document.createElement("div");
        div.innerHTML = `
          <b>${student.name}</b> (${student.studentId}) | Class: ${student.class} | WhatsApp: ${student.whatsapp}
          <button onclick="approveStudent('${id}')">Approve</button>
          <button onclick="denyStudent('${id}')">Deny</button>
        `;
        studentsContainer.appendChild(div);
      }
    });
  });
}

// Approve/Deny Student
function approveStudent(id){
  db.ref(`students/${id}/approved`).set(true).then(()=>showRegistrationRequests());
}

function denyStudent(id){
  db.ref(`students/${id}`).remove().then(()=>showRegistrationRequests());
}

// Show Break Requests
function showBreakRequests(){
  studentsContainer.innerHTML="";
  db.ref("breakRequests").once("value",snap=>{
    const data = snap.val();
    if(!data) return studentsContainer.innerHTML="No break requests.";
    Object.keys(data).forEach(id=>{
      const request = data[id];
      const div = document.createElement("div");
      div.innerHTML = `<b>${id}</b> - Requests: ${JSON.stringify(request)}`;
      studentsContainer.appendChild(div);
    });
  });
}

// Logout
document.getElementById("logout").addEventListener("click",()=>{
  firebase.auth().signOut().then(()=> window.location="index.html");
});
