import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase Config
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const studentId = localStorage.getItem("studentId");
if(!studentId){
  alert("❌ Please login first.");
  window.location.href = "index.html";
}

// -----------------------------
// 🔹 Logout
// -----------------------------
document.getElementById("studentLogoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("studentId");
    alert("✅ Logged out successfully!");
    window.location.href = "index.html";
  } catch (error) {
    alert("❌ Logout failed: " + error.message);
  }
});

// -----------------------------
// 🔹 Tab Switching
// -----------------------------
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    tabContents.forEach(tc => tc.style.display = "none");
    document.getElementById(tab).style.display = "block";

    if(tab === "profile") loadProfile();
    if(tab === "tuition") loadTuition();
    if(tab === "breakRequest") loadBreakRequest();
  });
});

// -----------------------------
// 🔹 Load Profile
// -----------------------------
async function loadProfile() {
  const profileDiv = document.getElementById("profile");
  try {
    const snapshot = await get(ref(db, `registrations/${studentId}`));
    if(snapshot.exists()){
      const data = snapshot.val();
      profileDiv.innerHTML = `<h4>My Profile</h4>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Student ID:</strong> ${data.studentId}</p>
        <p><strong>Class:</strong> ${data.class}</p>
        <p><strong>Roll:</strong> ${data.roll}</p>
        <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>`;
    } else {
      profileDiv.innerHTML = "Profile data not found.";
    }
  } catch(error) {
    profileDiv.innerHTML = "Error loading profile.";
    console.error(error);
  }
}

// -----------------------------
// 🔹 Load Tuition Fee Status
// -----------------------------
async function loadTuition() {
  const tuitionDiv = document.getElementById("tuition");
  tuitionDiv.innerHTML = "Loading...";
  try {
    const snapshot = await get(ref(db, `tuition/${studentId}`));
    const tuitionData = snapshot.exists() ? snapshot.val() : {};
    const now = new Date();
    const currentMonthIndex = now.getMonth(); // 0-indexed
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    
    let html = `<h4>Tuition Fee Status</h4>
      <table border="1" style="width:100%; text-align:left;">
      <tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th></tr>`;
    
    for(let i=0;i<=currentMonthIndex;i++){
      let m = months[i];
      let status = tuitionData[m]?.status || "";
      let date = tuitionData[m]?.date || "";
      let method = tuitionData[m]?.method || "";
      html += `<tr>
        <td>${m}</td>
        <td style="color:${status==="Paid"?"green":status==="Break"?"purple":"black"}">${status}</td>
        <td>${date}</td>
        <td>${method}</td>
      </tr>`;
    }
    html += "</table>";
    tuitionDiv.innerHTML = html;
  } catch(error) {
    tuitionDiv.innerHTML = "Error loading tuition data.";
    console.error(error);
  }
}

// -----------------------------
// 🔹 Load Break Request
// -----------------------------
function loadBreakRequest() {
  const breakDiv = document.getElementById("breakRequest");
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const upcoming = months.slice(currentMonthIndex+1);
  
  if(upcoming.length === 0){
    breakDiv.innerHTML = "No upcoming months available for break.";
    return;
  }

  let html = `<h4>Request Break</h4>
    <p>Select months to request break:</p>
    <form id="breakForm">`;

  upcoming.forEach(m => {
    html += `<input type="checkbox" name="breakMonth" value="${m}" /> ${m} <br>`;
  });
  html += `<button type="submit">Submit Break Request</button></form>
    <div id="breakStatus"></div>`;
  
  breakDiv.innerHTML = html;

  document.getElementById("breakForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const selectedMonths = Array.from(document.querySelectorAll('input[name="breakMonth"]:checked')).map(c=>c.value);
    if(selectedMonths.length === 0){
      alert("Select at least one month.");
      return;
    }
    try {
      await set(ref(db, `breakRequests/${studentId}`), {months:selectedMonths, approved:false});
      document.getElementById("breakStatus").innerHTML = "✅ Break request submitted!";
    } catch(error) {
      document.getElementById("breakStatus").innerHTML = "❌ Error submitting request.";
      console.error(error);
    }
  });
}
