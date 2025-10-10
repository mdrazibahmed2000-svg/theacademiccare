// student.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { logout } from "./script.js";

const db = getDatabase();
const studentId = localStorage.getItem("studentId");

// Load Profile
export async function loadProfile(){
  const snapshot = await get(ref(db, `registrations/${studentId}`));
  if(snapshot.exists()){
    const data = snapshot.val();
    document.getElementById("profileName").innerText = data.name;
    document.getElementById("profileClass").innerText = data.class;
    document.getElementById("profileRoll").innerText = data.roll;
    document.getElementById("profileWhatsApp").innerText = data.whatsapp;
  }
}

// Load Tuition Fee Status (up to current month)
export async function loadTuition(){
  const snapshot = await get(ref(db, `tuition/${studentId}`));
  const tuition = snapshot.val() || {};
  const container = document.getElementById("tuitionTable");
  container.innerHTML = "";

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();

  monthNames.forEach((month,i) => {
    if(i <= currentMonth){
      const status = tuition[month]?.status || "Unpaid";
      const date = tuition[month]?.date || "";
      const method = tuition[month]?.method || "";
      container.innerHTML += `<tr>
        <td>${month}</td>
        <td>${status}</td>
        <td>${date} | ${method}</td>
      </tr>`;
    }
  });
}

// Load Break Requests (upcoming months)
export async function loadBreakRequest(){
  const container = document.getElementById("breakRequestContainer");
  container.innerHTML = "";

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonth = new Date().getMonth();

  for(let i=currentMonth+1;i<12;i++){
    const div = document.createElement("div");
    div.innerHTML = `<input type="checkbox" id="${monthNames[i]}" /> ${monthNames[i]}`;
    container.appendChild(div);
  }
}

// Submit Break Request
document.getElementById("submitBreakRequest")?.addEventListener("click", async () => {
  const checkedMonths = [];
  const container = document.getElementById("breakRequestContainer");
  const inputs = container.querySelectorAll("input[type='checkbox']");
  inputs.forEach(input => {
    if(input.checked) checkedMonths.push(input.id);
  });

  if(checkedMonths.length === 0){
    alert("Select months for break.");
    return;
  }

  await update(ref(db, `breakRequests/${studentId}`), {months: checkedMonths, approved:false});
  alert("Break request submitted.");
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", logout);

// Initial load
loadProfile();
loadTuition();
loadBreakRequest();
