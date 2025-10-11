// =============================
// Firebase Initialization
// =============================
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // Logout
  // =============================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => window.location.href = "index.html");
    });
  }

  // =============================
  // Tab Navigation
  // =============================
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".section").forEach(s => s.style.display = "none");
      const target = tab.dataset.target;
      document.getElementById(target).style.display = "block";

      if(target === "classSection") loadClassSubTabs();
      if(target === "registrationSection") loadRegistrations();
      if(target === "breakSection") loadBreakRequests();
    });
  });

  // =============================
  // Load Class Sub-Tabs
  // =============================
  function loadClassSubTabs() {
    const container = document.getElementById("classSubTabs");
    container.innerHTML = "";
    for(let c=6; c<=12; c++){
      const btn = document.createElement("button");
      btn.textContent = `Class ${c}`;
      btn.addEventListener("click", () => loadStudentsByClass(c));
      container.appendChild(btn);
    }
  }

  // =============================
  // Load Students by Class
  // =============================
  function loadStudentsByClass(classNumber) {
    const container = document.getElementById("studentsList");
    container.innerHTML = "Loading...";
    db.ref("students").orderByChild("class").equalTo(String(classNumber))
      .on("value", snapshot => {
        container.innerHTML = "";
        snapshot.forEach(studentSnap => {
          const s = studentSnap.val();
          if(s.approved){
            const div = document.createElement("div");
            div.textContent = `${s.name} (${s.studentId}) - WhatsApp: ${s.whatsapp}`;

            // Tuition Fee Icon
            const tuitionBtn = document.createElement("button");
            tuitionBtn.textContent = "Manage Tuition";
            tuitionBtn.addEventListener("click", () => manageTuition(s.studentId));
            div.appendChild(tuitionBtn);

            container.appendChild(div);
          }
        });
      });
  }

  // =============================
  // Manage Tuition Fee
  // =============================
  function manageTuition(studentId){
    const tuitionRef = db.ref(`tuition/${studentId}`);
    tuitionRef.once("value", snap => {
      console.log("Tuition data for:", studentId, snap.val());
      alert("Implement tuition management table here!");
      // Add your Mark Paid / Mark Break / Undo logic
    });
  }

  // =============================
  // Load Registration Requests
  // =============================
  function loadRegistrations() {
    const container = document.getElementById("registrationList");
    container.innerHTML = "Loading...";
    db.ref("students").orderByChild("approved").equalTo(false)
      .once("value", snapshot => {
        container.innerHTML = "";
        snapshot.forEach(snap => {
          const s = snap.val();
          const div = document.createElement("div");
          div.textContent = `${s.name} (${s.studentId}) - Class: ${s.class} - Roll: ${s.roll}`;
          
          const approveBtn = document.createElement("button");
          approveBtn.textContent = "Approve";
          approveBtn.addEventListener("click", () => {
            db.ref(`students/${s.studentId}/approved`).set(true);
            loadRegistrations();
          });

          const denyBtn = document.createElement("button");
          denyBtn.textContent = "Deny";
          denyBtn.addEventListener("click", () => {
            db.ref(`students/${s.studentId}`).remove();
            loadRegistrations();
          });

          div.appendChild(approveBtn);
          div.appendChild(denyBtn);
          container.appendChild(div);
        });
      });
  }

  // =============================
  // Load Break Requests
  // =============================
  function loadBreakRequests(){
    const container = document.getElementById("breakRequestsList");
    container.innerHTML = "Loading...";
    db.ref("breakRequests").once("value", snap => {
      container.innerHTML = "";
      snap.forEach(studentSnap => {
        const studentId = studentSnap.key;
        const div = document.createElement("div");
        div.textContent = `Break Request: ${studentId}`;
        container.appendChild(div);
      });
    });
  }

});
