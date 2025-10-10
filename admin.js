const auth = firebase.auth();
const db = firebase.database();

// Tabs
const tabBtns = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabContents.forEach(c => c.style.display = 'none');
    if(tab) document.getElementById(tab).style.display = 'block';
    if(tab === 'class') loadClassTabs();
    if(tab === 'registration') loadRegistration();
    if(tab === 'breakRequest') loadBreakRequests();
  });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut().then(() => window.location.href = 'index.html');
});

// Load class sub-tabs
function loadClassTabs() {
  const classTabsDiv = document.getElementById('classTabs');
  classTabsDiv.innerHTML = '';
  for(let cls=6; cls<=12; cls++){
    const btn = document.createElement('button');
    btn.textContent = `Class ${cls}`;
    btn.addEventListener('click', () => loadStudents(cls));
    classTabsDiv.appendChild(btn);
  }
}

// Load students for a class
function loadStudents(cls){
  const studentsListDiv = document.getElementById('studentsList');
  studentsListDiv.innerHTML = '';
  db.ref('students').get().then(snapshot => {
    snapshot.forEach(snap => {
      const s = snap.val();
      const id = snap.key;
      if(s.class == cls && s.approved){
        const div = document.createElement('div');
        div.innerHTML = `
          ${s.name} (${id}) - ${s.whatsapp} 
          <button onclick="manageTuition('${id}')">Tuition Status</button>`;
        studentsListDiv.appendChild(div);
      }
    });
  });
}

// Load registration requests
function loadRegistration(){
  const regDiv = document.getElementById('registrationList');
  regDiv.innerHTML = '';
  db.ref('students').get().then(snapshot => {
    snapshot.forEach(snap => {
      const s = snap.val();
      const id = snap.key;
      if(!s.approved && !s.denied){
        const div = document.createElement('div');
        div.innerHTML = `
          ${s.name} (${id}) - ${s.whatsapp} 
          <button onclick="approve('${id}')">Approve</button>
          <button onclick="deny('${id}')">Deny</button>`;
        regDiv.appendChild(div);
      }
    });
  });
}

// Approve / Deny
window.approve = id => db.ref(`students/${id}/approved`).set(true);
window.deny = id => db.ref(`students/${id}/denied`).set(true);

// Placeholder for tuition management (Mark Paid/Break/Undo)
window.manageTuition = id => alert(`Open tuition table for ${id}`);

// Break Requests placeholder
function loadBreakRequests(){
  const breakDiv = document.getElementById('breakRequestList');
  breakDiv.innerHTML = 'No break requests yet';
}
