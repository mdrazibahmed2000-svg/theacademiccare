// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get studentId from URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("studentId");

const container = document.getElementById("tuitionContainer");

// Back Button
document.getElementById("backBtn").addEventListener("click", ()=>{
  window.location = "adminPanel.html";
});

// Load tuition data
function loadTuition() {
  container.innerHTML = `<h3>Tuition Management for ${studentId}</h3>`;

  const table = document.createElement("table");
  table.border = "1";
  table.style.width = "100%";
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Month's Name</th>
      <th>Status</th>
      <th>Date & Method</th>
      <th>Action</th>
    </tr>
  `;
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
  }).then(()=> loadTuition());
}

function markBreak(studentId, month){
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Break",
    date: "",
    method: ""
  }).then(()=> loadTuition());
}

function undoStatus(studentId, month){
  db.ref(`tuition/${studentId}/${month}`).set({
    status: "Unpaid",
    date: "",
    method: ""
  }).then(()=> loadTuition());
}

// Initial Load
loadTuition();
