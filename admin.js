import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ------------------- FIREBASE CONFIG -------------------
const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasestorage.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ------------------- ELEMENTS -------------------
const homeTab = document.getElementById("homeTab");
const registrationTab = document.getElementById("registrationTab");
const breakRequestTab = document.getElementById("breakRequestTab");
const classesTab = document.getElementById("classesTab");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const homeContent = document.getElementById("homeContent");
const registrationContent = document.getElementById("registrationContent");
const breakRequestContent = document.getElementById("breakRequestContent");
const classesContent = document.getElementById("classesContent");

// ------------------- NAVIGATION -------------------
homeTab.addEventListener("click", () => {
  homeContent.style.display = "block";
  registrationContent.style.display = "none";
  breakRequestContent.style.display = "none";
  classesContent.style.display = "none";
});

registrationTab.addEventListener("click", async () => {
  homeContent.style.display = "none";
  registrationContent.style.display = "block";
  breakRequestContent.style.display = "none";
  classesContent.style.display = "none";

  const snapshot = await get(ref(db, "Registrations"));
  registrationContent.innerHTML = "<h3>Pending Registrations</h3>";

  snapshot.forEach(childSnap => {
    const data = childSnap.val();
    if (!data.approved) {
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${childSnap.key} - ${data.name} (Class: ${data.class}, Roll: ${data.roll}) 
        <button onclick="approveStudent('${childSnap.key}')">Approve</button></p>
      `;
      registrationContent.appendChild(div);
    }
  });
});

// ------------------- APPROVE STUDENT -------------------
window.approveStudent = async (studentId) => {
  try {
    await update(ref(db, `Registrations/${studentId}`), { approved: true });
    alert(`${studentId} approved successfully!`);
    location.reload();
  } catch (err) {
    alert("Error approving student: " + err.message);
  }
};

// ------------------- LOGOUT -------------------
adminLogoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
