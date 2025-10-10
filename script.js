// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getDatabase, ref, set, push, child, get, onValue, update, remove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

/* -----------------------
  Firebase config (from you)
-------------------------*/
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
const auth = getAuth(app);
const db = getDatabase(app);

/* ---------- App constants ---------- */
const ACADEMIC_YEAR = 2025; // fixed per your spec
const ADMIN_UID = "xg4XNMsSJqbXMZ57qicrpgfM6Yn1"; // you provided earlier (not used directly here)
const WA_ADMIN_NUMBER = ""; // optionally put admin whatsapp number like +8801XXXXXXXXX

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function nowYear() { return ACADEMIC_YEAR; }
function currentMonthIndex() { return new Date().getMonth(); } // 0-based
function formatDate(ts = Date.now()){ const d=new Date(ts); return d.toLocaleDateString();}

/* ---------- UI references ---------- */
const identifier = $('identifier');
const adminEmailRow = $('admin-email-row');
const adminEmail = $('admin-email');
const password = $('password');
const loginBtn = $('login-btn');
const resetWA = $('reset-wa');

const submitRegistration = $('submit-registration');
const regResult = $('reg-result');

const regName = $('reg-name');
const regClass = $('reg-class');
const regRoll = $('reg-roll');
const regWhatsapp = $('reg-whatsapp');
const regPass = $('reg-pass');
const regPassConfirm = $('reg-pass-confirm');

const authSection = $('auth-section');
const appSection = $('app-section');

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const adminPanel = $('admin-panel');
const studentPanel = $('student-panel');
const welcomeText = $('welcome-text');

/* Admin UI refs */
const classSubtabs = $('class-subtabs');
const classList = $('class-list');
const tuitionModal = $('tuition-modal');
const tuitionModalTitle = $('tuition-modal-title');
const tuitionTableWrap = $('tuition-table-wrap');
const closeTuition = $('close-tuition');

const registrationRequests = $('registration-requests');
const adminBreakRequests = $('admin-break-requests');

/* Student UI refs */
const profileInfo = $('profile-info');
const studentTuitionTable = $('student-tuition-table');
const studentBreakList = $('student-break-list');
const breakResult = $('break-result');
const submitBreakRequestBtn = $('submit-break-request');

/* ---------- Basic interactivity ---------- */
identifier.addEventListener('input', e=>{
  const v = e.target.value.trim().toLowerCase();
  if(v === 'admin'){
    adminEmailRow.classList.remove('hidden');
    adminEmail.required = true;
  } else {
    adminEmailRow.classList.add('hidden');
    adminEmail.required = false;
  }
});

/* Tabs */
tabs.forEach(t => t.addEventListener('click', (ev)=>{
  tabs.forEach(x=>x.classList.remove('active'));
  ev.currentTarget.classList.add('active');
  const target = ev.currentTarget.dataset.target;
  tabContents.forEach(c=>c.classList.add('hidden'));
  $(target).classList.remove('hidden');
}));

/* Basic auth/login */
loginBtn.addEventListener('click', async ()=>{
  const idval = identifier.value.trim();
  const pass = password.value;
  if(!idval || !pass){ alert('Provide ID/email and password'); return; }

  if(idval.toLowerCase() === 'admin'){
    const email = adminEmail.value.trim();
    if(!email){ alert('Enter admin email'); return;}
    // admin login using Firebase Auth (email/password)
    try{
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      // Show admin panel
      setupAfterLogin({role:'admin', uid: cred.user.uid, email});
    }catch(err){
      alert('Admin sign-in failed: '+err.message);
    }
  } else {
    // treat as student id; we use email-based auth where student was created with email = studentId@example.com or stored in DB
    // This sample approach: we attempt to sign in with student email = studentId + "@student.theacademiccare"
    // If you register students in auth with real email, you should adapt.
    const studentId = idval;
    const studentEmail = `${studentId}@student.theacademiccare`;
    try{
      const cred = await signInWithEmailAndPassword(auth, studentEmail, pass);
      // load student profile
      setupAfterLogin({role:'student', uid: cred.user.uid, studentId});
    }catch(err){
      alert('Student sign-in failed: '+err.message + '\n\nNote: This demo expects students to be created in Firebase Authentication with email format ' + studentEmail + '. Alternatively, adapt sign-in flow to use custom auth or create users programmatically.');
    }
  }
});

/* Reset via WhatsApp: creates template message and opens wa.me (no specific number set) */
resetWA.addEventListener('click', ()=>{
  const idval = identifier.value.trim();
  const studentId = idval || 'YourStudentID';
  const message = encodeURIComponent(`Hello Admin, I (${studentId}) forgot my password. Please reset it for me. My WhatsApp contact: __________`);
  // if you want to open to a specific number put number after wa.me/, e.g. https://wa.me/8801...
  const url = WA_ADMIN_NUMBER ? `https://wa.me/${WA_ADMIN_NUMBER}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url,'_blank');
});

/* ------------------ Registration flow ------------------ */
submitRegistration.addEventListener('click', async ()=>{
  const name = regName.value.trim();
  const cls = regClass.value.trim();
  const roll = regRoll.value.trim();
  const wa = regWhatsapp.value.trim();
  const pass = regPass.value;
  const passc = regPassConfirm.value;

  if(!name || !cls || !roll || !wa || !pass || !passc) { regResult.innerText = 'Fill all fields'; return; }
  if(pass !== passc){ regResult.innerText = 'Passwords do not match'; return; }

  // generate student id: S[Year][Class][Roll] (class and roll padded)
  const classP = cls.toString().padStart(2,'0');
  const rollP = roll.toString().padStart(2,'0');
  const studentId = `S${nowYear()}${classP}${rollP}`;

  // create a registration request entry
  const regRef = ref(db, `registrations/${studentId}`);
  const regObj = {
    studentId,
    name,
    class: cls,
    roll,
    whatsapp: wa,
    password: pass,
    status: 'pending',
    createdAt: Date.now()
  };
  await set(regRef, regObj);
  regResult.innerText = `Registration submitted. Your temporary Student ID: ${studentId}. Wait for admin approval.`;
  // Clear fields (optional)
  regName.value=''; regClass.value=''; regRoll.value=''; regWhatsapp.value=''; regPass.value=''; regPassConfirm.value='';
});

/* ------------------ After login setup ------------------ */
async function setupAfterLogin(session){
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');

  if(session.role === 'admin'){
    welcomeText.innerText = 'Welcome Admin';
    adminPanel.classList.remove('hidden');
    studentPanel.classList.add('hidden');
    loadAdminPanel();
  } else {
    welcomeText.innerText = `Welcome ${session.studentId}`;
    adminPanel.classList.add('hidden');
    studentPanel.classList.remove('hidden');
    loadStudentPanel(session.studentId);
  }
}

/* ------------------ ADMIN: load panel ------------------ */
function loadAdminPanel(){
  // build class subtabs for 6..12
  classSubtabs.innerHTML = '';
  for(let c=6;c<=12;c++){
    const btn = document.createElement('button');
    btn.textContent = `Class ${c}`;
    btn.addEventListener('click', ()=> loadClassList(c));
    classSubtabs.appendChild(btn);
  }

  // watch registration requests
  const regRef = ref(db, 'registrations');
  onValue(regRef, snap=>{
    const val = snap.val() || {};
    renderRegistrationRequests(val);
  });

  // watch break requests
  const brRef = ref(db, 'breakRequests');
  onValue(brRef, snap=>{
    const val = snap.val() || {};
    renderAdminBreakRequests(val);
  });

  // admin tabs behavior
  document.querySelectorAll('.admin-tab').forEach(b=>{
    b.addEventListener('click', ev=>{
      document.querySelectorAll('.admin-content').forEach(c=>c.classList.add('hidden'));
      const target = ev.currentTarget.dataset.adminTarget;
      $(target).classList.remove('hidden');
    });
  });

  // show admin home by default
  document.querySelector('[data-admin-target="admin-home"]').click();
}

/* load students for class */
async function loadClassList(cls){
  classList.innerHTML = `<div class="small-muted">Loading Class ${cls} ...</div>`;
  const studentsRef = ref(db, 'students');
  const snap = await get(studentsRef);
  const all = snap.exists() ? snap.val() : {};
  // filter by class
  const arr = Object.values(all).filter(s => s.class == cls && s.status === 'approved');
  if(arr.length === 0){ classList.innerHTML = `<div class="small-muted">No approved students in Class ${cls}.</div>`; return; }

  classList.innerHTML = '';
  arr.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'student-row';
    row.innerHTML = `<div><strong>${s.name}</strong><div class="small-muted">${s.studentId} • ${s.whatsapp}</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="icon-btn" title="Manage tuition" data-student="${s.studentId}">Tuition</button>
      </div>`;
    classList.appendChild(row);
    row.querySelector('button[data-student]').addEventListener('click', ()=> openTuitionModal(s.studentId, s.name, s.class));
  });
}

/* tuition modal */
async function openTuitionModal(studentId, name, cls){
  tuitionModalTitle.innerText = `${name} (${studentId}) — Tuition (${ACADEMIC_YEAR})`;
  tuitionTableWrap.innerHTML = '<div class="small-muted">Loading...</div>';
  tuitionModal.classList.remove('hidden');

  // Build months up to current month (0-index)
  const upto = currentMonthIndex();
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead><tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr></thead>`;
  const tbody = document.createElement('tbody');

  // fetch current tuition data snapshot for student
  const tRef = ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}`);
  const snap = await get(tRef);
  const tuitionData = snap.exists() ? snap.val() : {};

  for(let m = 0; m<=upto; m++){
    const row = document.createElement('tr');
    const monthName = months[m];
    const monthKey = `m${m+1}`;
    const data = tuitionData && tuitionData[monthKey] ? tuitionData[monthKey] : null;
    let statusHtml = `<span class="status-pill unpaid">Unpaid</span>`;
    let dm = '-';
    let actions = `<button class="btn small" data-action="mark-paid" data-month="${m}">Mark Paid</button>
                   <button class="btn small ghost" data-action="mark-break" data-month="${m}">Mark Break</button>`;
    if(data){
      if(data.status === 'Paid'){
        statusHtml = `<span class="status-pill paid">Paid</span>`;
        dm = `${formatDate(data.date)} • ${data.method || '-'}`;
        actions = `<button class="btn small ghost" data-action="undo" data-month="${m}">Undo</button>`;
      } else if(data.status === 'Break'){
        statusHtml = `<span class="status-pill break">Break</span>`;
        dm = `${formatDate(data.date)} • ${data.method || '-'}`;
        actions = `<button class="btn small ghost" data-action="undo" data-month="${m}">Undo</button>`;
      }
    }

    row.innerHTML = `<td>${monthName}</td><td>${statusHtml}</td><td>${dm}</td><td>${actions}</td>`;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  tuitionTableWrap.innerHTML = '';
  tuitionTableWrap.appendChild(table);

  // attach listeners for action buttons
  tuitionTableWrap.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async (ev)=>{
      const action = btn.dataset.action;
      const month = parseInt(btn.dataset.month);
      if(action === 'mark-paid'){
        const method = prompt('Enter payment method (e.g. bKash tx id, cash):','Cash');
        if(method === null) return;
        const obj = { status:'Paid', date:Date.now(), method, actionBy:'admin' };
        await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${month+1}`), obj);
        alert('Marked Paid.');
        openTuitionModal(studentId,name,cls);
      } else if(action === 'mark-break'){
        const obj = { status:'Break', date:Date.now(), method:'-', actionBy:'admin' };
        await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${month+1}`), obj);
        alert('Marked Break.');
        openTuitionModal(studentId,name,cls);
      } else if(action === 'undo'){
        // undo means remove that month entry
        await remove(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${month+1}`));
        alert('Undo performed.');
        openTuitionModal(studentId,name,cls);
      }
    });
  });
}

closeTuition.addEventListener('click', ()=> tuitionModal.classList.add('hidden'));

/* Registration requests rendering */
function renderRegistrationRequests(data){
  registrationRequests.innerHTML = '';
  const keys = Object.keys(data || {});
  if(keys.length === 0){ registrationRequests.innerHTML = `<div class="small-muted">No registration requests.</div>`; return; }
  keys.forEach(k=>{
    const r = data[k];
    const row = document.createElement('div');
    row.className = 'student-row';
    row.innerHTML = `<div><strong>${r.name}</strong><div class="small-muted">${r.studentId} • Class ${r.class} • ${r.whatsapp}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn small" data-action="approve" data-id="${r.studentId}">Approve</button>
        <button class="btn small ghost" data-action="deny" data-id="${r.studentId}">Deny</button>
      </div>`;
    registrationRequests.appendChild(row);
    row.querySelector('[data-action="approve"]').addEventListener('click', ()=> approveRegistration(r));
    row.querySelector('[data-action="deny"]').addEventListener('click', ()=> denyRegistration(r.studentId));
  });
}

async function approveRegistration(reg){
  // create in /students and mark registration status approved
  const studentObj = {
    studentId: reg.studentId,
    name: reg.name,
    class: reg.class,
    roll: reg.roll,
    whatsapp: reg.whatsapp,
    status: 'approved',
    createdAt: Date.now()
  };
  await set(ref(db, `students/${reg.studentId}`), studentObj);
  await update(ref(db, `registrations/${reg.studentId}`), { status:'approved', approvedAt:Date.now() });

  // Optionally create auth user for student with email studentId@student.theacademiccare (demo)
  const email = `${reg.studentId}@student.theacademiccare`;
  try{
    await createUserWithEmailAndPassword(auth, email, reg.password);
    alert(`Approved and auth user created: ${email}`);
  }catch(e){
    // creation may fail if you prefer to create via admin SDK; still registration approved in DB
    console.warn('Could not create auth user (create via Admin SDK if needed):', e.message);
    alert(`Approved. (Note: create student auth user via Admin SDK or adjust flow.)`);
  }
}

async function denyRegistration(studentId){
  await update(ref(db, `registrations/${studentId}`), { status:'denied', deniedAt:Date.now() });
  alert('Registration denied.');
}

/* Admin break requests */
function renderAdminBreakRequests(data){
  adminBreakRequests.innerHTML = '';
  // data is expected shape: { studentId: { requestId: { months: [..], status: 'pending', createdAt:... } } }
  const list = [];
  for(const sid in data){
    const reqs = data[sid];
    for(const rid in reqs){
      const r = reqs[rid];
      r.studentId = sid;
      r.requestId = rid;
      list.push(r);
    }
  }
  if(list.length === 0){ adminBreakRequests.innerHTML = `<div class="small-muted">No break requests.</div>`; return; }
  adminBreakRequests.innerHTML = '';
  list.forEach(r=>{
    const el = document.createElement('div');
    el.className = 'student-row';
    el.innerHTML = `<div><strong>${r.studentId}</strong><div class="small-muted">${r.months.map(m=>months[m]).join(', ')}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn small" data-act="approve" data-s="${r.studentId}" data-r="${r.requestId}">Approve</button>
        <button class="btn small ghost" data-act="deny" data-s="${r.studentId}" data-r="${r.requestId}">Deny</button>
      </div>`;
    adminBreakRequests.appendChild(el);
    el.querySelector('[data-act="approve"]').addEventListener('click', ()=> adminApproveBreak(r.studentId, r.requestId, r.months));
    el.querySelector('[data-act="deny"]').addEventListener('click', ()=> adminDenyBreak(r.studentId, r.requestId));
  });
}

async function adminApproveBreak(studentId, requestId, monthsArr){
  // mark those months as Break in tuition
  for(const m of monthsArr){
    await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${m+1}`), { status:'Break', date:Date.now(), method:'-', actionBy:'admin' });
  }
  await update(ref(db, `breakRequests/${studentId}/${requestId}`), { status:'approved', actionAt:Date.now() });
  alert('Break approved & applied.');
}

async function adminDenyBreak(studentId, requestId){
  await update(ref(db, `breakRequests/${studentId}/${requestId}`), { status:'denied', actionAt:Date.now() });
  alert('Break request denied.');
}

/* ------------------ STUDENT panel ------------------ */
async function loadStudentPanel(studentId){
  // fetch profile
  const profSnap = await get(ref(db, `students/${studentId}`));
  if(!profSnap.exists()){ profileInfo.innerHTML = `<div class="small-muted">Profile not found or not approved yet.</div>`; return; }
  const prof = profSnap.val();
  profileInfo.innerHTML = `<p><strong>${prof.name}</strong></p>
    <p>Student ID: ${prof.studentId}</p>
    <p>Class: ${prof.class}</p>
    <p>Roll: ${prof.roll}</p>
    <p>WhatsApp: ${prof.whatsapp}</p>`;

  // student tabs behavior
  document.querySelectorAll('.student-tab').forEach(b=>{
    b.addEventListener('click',(ev)=>{
      document.querySelectorAll('.student-content').forEach(c=>c.classList.add('hidden'));
      const target = ev.currentTarget.dataset.studentTarget;
      $(target).classList.remove('hidden');
    });
  });

  // default student-home
  document.querySelector('[data-student-target="student-home"]').click();

  // build tuition status table (up to current month)
  renderStudentTuition(studentId);

  // build break request UI (upcoming months)
  renderStudentBreakUI(studentId);
}

/* Render student's tuition up to current month */
async function renderStudentTuition(studentId){
  const upto = currentMonthIndex();
  const tSnap = await get(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}`));
  const data = tSnap.exists() ? tSnap.val() : {};

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead><tr><th>Month</th><th>Status</th><th>Date & Method</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  for(let m=0;m<=upto;m++){
    const monthKey = `m${m+1}`;
    const d = data && data[monthKey] ? data[monthKey] : null;
    let status = `<span class="status-pill unpaid">Unpaid</span>`;
    let dm = '-';
    if(d){
      if(d.status === 'Paid'){ status = `<span class="status-pill paid">Paid</span>`; dm = `${formatDate(d.date)} • ${d.method}`;}
      else if(d.status === 'Break'){ status = `<span class="status-pill break">Break</span>`; dm = `${formatDate(d.date)} • ${d.method}`; }
    }
    const row = document.createElement('tr');
    row.innerHTML = `<td>${months[m]}</td><td>${status}</td><td>${dm}</td>`;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  studentTuitionTable.innerHTML = '';
  studentTuitionTable.appendChild(table);
}

/* Render student break UI for upcoming months (after current month) */
async function renderStudentBreakUI(studentId){
  studentBreakList.innerHTML = '';
  const upto = currentMonthIndex();
  const upcoming = [];
  for(let m=upto+1; m<12; m++) upcoming.push(m);

  if(upcoming.length === 0){
    studentBreakList.innerHTML = `<div class="small-muted">No upcoming months available.</div>`;
    return;
  }

  upcoming.forEach(m=>{
    const cb = document.createElement('label');
    cb.style.display='block';
    cb.innerHTML = `<input type="checkbox" value="${m}" /> ${months[m]}`;
    studentBreakList.appendChild(cb);
  });

  submitBreakRequestBtn.onclick = async ()=>{
    const checked = Array.from(studentBreakList.querySelectorAll('input:checked')).map(i=>parseInt(i.value));
    if(checked.length === 0){ breakResult.innerText = 'Select at least one month'; return; }
    const brRef = ref(db, `breakRequests/${studentId}`);
    const newReq = push(brRef);
    await set(newReq, {
      months: checked,
      status: 'pending',
      createdAt: Date.now()
    });
    breakResult.innerText = 'Break request submitted.';
    // clear boxes
    studentBreakList.querySelectorAll('input:checked').forEach(i=>i.checked=false);
  }
}

/* ------------------ Listen for auth state changes (optional) ------------------ */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
onAuthStateChanged(auth, user=>{
  // nothing needed automatically — this demo expects explicit login -> UI switch
});

/* ------------------ Load initial minimal data watchers for admin and student lists as needed  ------------------ */
/* End of script.js */
