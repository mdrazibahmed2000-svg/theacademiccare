const auth = firebase.auth();
const db = firebase.database();
const studentId = sessionStorage.getItem('studentId');

// Tabs
const tabBtns = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabContents.forEach(c => c.style.display = 'none');
    if(tab) document.getElementById(tab).style.display = 'block';
    if(tab === 'profile') loadProfile();
    if(tab === 'tuition') loadTuition();
    if(tab === 'breakRequest') loadBreakRequest();
  });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('studentId');
  window.location.href = 'index.html';
});

// Load Profile
function loadProfile(){
  db.ref(`students/${studentId}`).get().then(snap => {
    const s = snap.val();
    const profileDiv = document.getElementById('profile');
    profileDiv.innerHTML = `
      Name: ${s.name}<br>
      Class: ${s.class}<br>
      Roll: ${s.roll}<br>
      WhatsApp: ${s.whatsapp}<br>
      Student ID: ${studentId}
    `;
  });
}

// Load Tuition Fee Status (placeholder)
function loadTuition(){
  const tuitionDiv = document.getElementById('tuition');
  tuitionDiv.innerHTML = 'Tuition info will appear here';
}

// Load Break Request (placeholder)
function loadBreakRequest(){
  const breakDiv = document.getElementById('breakRequest');
  breakDiv.innerHTML = 'Break request form will appear here';
}
