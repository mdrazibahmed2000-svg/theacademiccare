// script.js (module) — shared by index.html, admin.html, student.html
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getDatabase, ref, set, push, get, onValue, update, remove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

/* ---------------- CONFIG ---------------- */
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

const ACADEMIC_YEAR = 2025;
const ADMIN_EMAIL = "theacademiccare2025@gmail.com";
const WA_ADMIN_NUMBER = ""; // set +8801... if you want direct WA to admin

/* ---------------- INIT ---------------- */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function $(id){ return document.getElementById(id); }
function nowDate(){ return Date.now(); }
function formatDate(ts){ return new Date(ts).toLocaleDateString(); }
function currentMonthIndex(){ return new Date().getMonth(); }

/* ---------------- PAGE DETECTION ---------------- */
const isIndex = !!document.querySelector('.auth-card') && !!document.querySelector('.register-card');
const isAdminPage = !!document.querySelector('.admin-top');
const isStudentPage = !!document.querySelector('#student-id');

/* ---------------- INDEX PAGE LOGIC ---------------- */
if(isIndex){
  // elements
  const idInput = $('login-identifier');
  const passInput = $('login-password');
  const btnLogin = $('btn-login');
  const btnOpenAdmin = $('btn-open-admin');
  const btnResetWA = $('btn-reset-wa');

  const regName = $('reg-name');
  const regClass = $('reg-class');
  const regRoll = $('reg-roll');
  const regWa = $('reg-wa');
  const regPass = $('reg-pass');
  const regPassc = $('reg-passc');
  const btnRegister = $('btn-register');
  const regResult = $('reg-result');

  btnLogin.addEventListener('click', async ()=>{
    const idv = idInput.value.trim();
    const pass = passInput.value;
    if(!idv || !pass){ alert('Provide identifier and password'); return; }

    // If email-like, treat as admin or email-based sign-in
    if(idv === ADMIN_EMAIL || idv.includes('@')){
      // Attempt sign-in with given email
      try{
        await signInWithEmailAndPassword(auth, idv, pass);
        // If admin email -> open admin panel
        if(idv === ADMIN_EMAIL){
          window.location.href = 'admin.html';
        } else {
          // other emails open student panel (fallback)
          window.location.href = 'student.html';
        }
      }catch(err){
        alert('Sign-in failed: '+err.message);
      }
      return;
    }

    // else treat as Student ID (S2025...)
    const studentId = idv.toUpperCase();
    const studentEmail = `${studentId}@student.theacademiccare`;
    try{
      await signInWithEmailAndPassword(auth, studentEmail, pass);
      // store studentId locally and open student panel
      localStorage.setItem('studentId', studentId);
      window.location.href = 'student.html';
    }catch(err){
      alert('Student sign-in failed: '+err.message + '\n\nNote: if your account was not created in Authentication yet, wait for admin approval.');
    }
  });

  btnOpenAdmin.addEventListener('click', ()=> window.open('admin.html','_blank'));

  btnResetWA.addEventListener('click', ()=>{
    const idval = idInput.value.trim() || 'MyStudentID';
    const message = encodeURIComponent(`Hello Admin, I (${idval}) forgot my password. Please help to reset. My WhatsApp number: __________`);
    const waUrl = WA_ADMIN_NUMBER ? `https://wa.me/${WA_ADMIN_NUMBER}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl,'_blank');
  });

  btnRegister.addEventListener('click', async ()=>{
    const name = regName.value.trim();
    const cls = regClass.value.trim();
    const roll = regRoll.value.trim();
    const wa = regWa.value.trim();
    const p1 = regPass.value;
    const p2 = regPassc.value;
    if(!name || !cls || !roll || !wa || !p1 || !p2){ regResult.innerText = 'Fill all fields'; return; }
    if(p1 !== p2){ regResult.innerText = 'Passwords do not match'; return; }
    const classP = cls.toString().padStart(2,'0');
    const rollP = roll.toString().padStart(2,'0');
    const studentId = `S${ACADEMIC_YEAR}${classP}${rollP}`;
    // save registration
    await set(ref(db, `registrations/${studentId}`), {
      studentId, name, class: cls, roll, whatsapp: wa, password: p1, status:'pending', createdAt: nowDate()
    });
    regResult.innerText = `Submitted. Your temporary student ID: ${studentId}. Wait for admin approval.`;
    // clear
    regName.value=''; regClass.value=''; regRoll.value=''; regWa.value=''; regPass.value=''; regPassc.value='';
  });
}

/* ---------------- ADMIN PAGE LOGIC ---------------- */
if(isAdminPage){
  const adminEmailInput = $('admin-email');
  const adminPassInput = $('admin-pass');
  const adminSignInBtn = $('admin-signin');
  const adminSignOutBtn = $('admin-signout');
  const adminAreas = $('admin-areas');

  const tabs = document.querySelectorAll('.tab');
  const adminHome = $('admin-home');
  const adminClass = $('admin-class');
  const adminReg = $('admin-registration');
  const adminBreaks = $('admin-breaks');

  const classSubtabs = $('class-subtabs');
  const classStudents = $('class-students');
  const registrationList = $('registration-list');
  const breakRequestList = $('break-request-list');

  function showTab(target){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(c=>c.classList.add('hidden'));
    const btn = Array.from(tabs).find(t=>t.dataset.target === target);
    if(btn) btn.classList.add('active');
    $(target).classList.remove('hidden');
  }

  tabs.forEach(b=>{
    b.addEventListener('click', ()=> showTab(b.dataset.target));
  });

  // Sign in admin
  adminSignInBtn.addEventListener('click', async ()=>{
    const email = adminEmailInput.value.trim();
    const pass = adminPassInput.value;
    if(!email || !pass){ alert('Provide admin email & password'); return; }
    try{
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      // only allow if email matches ADMIN_EMAIL
      if(email !== ADMIN_EMAIL){
        alert('Signed in but not admin email. This panel is for admin email only.');
      }
      adminSignOutBtn.classList.remove('hidden');
      adminSignInBtn.classList.add('hidden');
      adminAreas.classList.remove('hidden');
      loadAdminFeatures();
    }catch(err){
      alert('Admin sign-in failed: '+err.message);
    }
  });

  adminSignOutBtn.addEventListener('click', async ()=>{
    try{ await signOut(auth); adminSignOutBtn.classList.add('hidden'); adminSignInBtn.classList.remove('hidden'); adminAreas.classList.add('hidden'); }catch(e){console.error(e);}
  });

  /* ADMIN FEATURES */
  function loadAdminFeatures(){
    // build class subtabs 6..12
    classSubtabs.innerHTML = '';
    for(let c=6;c<=12;c++){
      const btn = document.createElement('button');
      btn.textContent = `Class ${c}`;
      btn.addEventListener('click', ()=> loadClassStudents(c));
      classSubtabs.appendChild(btn);
    }

    // watch registrations
    const regsRef = ref(db, 'registrations');
    onValue(regsRef, snap=>{
      const val = snap.val() || {};
      renderRegistrations(val);
    });

    // watch break requests
    const brRef = ref(db, 'breakRequests');
    onValue(brRef, snap=>{
      const val = snap.val() || {};
      renderBreakRequests(val);
    });
  }

  async function loadClassStudents(cls){
    classStudents.innerHTML = '<div class="small-muted">Loading...</div>';
    const snap = await get(ref(db, 'students'));
    const all = snap.exists() ? snap.val() : {};
    const arr = Object.values(all).filter(s => s.class == cls && s.status === 'approved');
    if(arr.length === 0){ classStudents.innerHTML = `<div class="small-muted">No approved students in Class ${cls}.</div>`; return; }
    classStudents.innerHTML = '';
    arr.forEach(s=>{
      const div = document.createElement('div');
      div.className = 'class-item row';
      div.style.justifyContent = 'space-between';
      div.innerHTML = `<div><strong>${s.name}</strong><div class="small-muted">${s.studentId} • ${s.whatsapp}</div></div>
        <div style="display:flex;gap:8px;">
          <button class="btn small" data-student="${s.studentId}">Tuition</button>
        </div>`;
      classStudents.appendChild(div);
      div.querySelector('button').addEventListener('click', ()=> openTuitionModalAdmin(s.studentId, s.name));
    });
  }

  async function renderRegistrations(data){
    registrationList.innerHTML = '';
    const keys = Object.keys(data || {});
    if(keys.length === 0){ registrationList.innerHTML = `<div class="small-muted">No registration requests.</div>`; return; }
    keys.forEach(k=>{
      const r = data[k];
      const el = document.createElement('div');
      el.className = 'student-row';
      el.style.justifyContent = 'space-between';
      el.innerHTML = `<div><strong>${r.name}</strong><div class="small-muted">${r.studentId} • Class ${r.class} • ${r.whatsapp} • ${r.status}</div></div>
        <div style="display:flex;gap:8px;">
          <button class="btn small" data-act="approve" data-id="${r.studentId}">Approve</button>
          <button class="btn small ghost" data-act="deny" data-id="${r.studentId}">Deny</button>
        </div>`;
      registrationList.appendChild(el);
      el.querySelector('[data-act="approve"]').addEventListener('click', ()=> approveRegistration(r));
      el.querySelector('[data-act="deny"]').addEventListener('click', ()=> denyRegistration(r.studentId));
    });
  }

  async function approveRegistration(reg){
    // create student record
    const studentObj = {
      studentId: reg.studentId, name: reg.name, class: reg.class, roll: reg.roll, whatsapp: reg.whatsapp,
      status: 'approved', createdAt: nowDate()
    };
    await set(ref(db, `students/${reg.studentId}`), studentObj);
    await update(ref(db, `registrations/${reg.studentId}`), { status:'approved', approvedAt: nowDate() });
    // create auth user for student using pattern studentId@student.theacademiccare
    const email = `${reg.studentId}@student.theacademiccare`;
    try{
      await createUserWithEmailAndPassword(auth, email, reg.password);
      alert(`Approved and auth user created: ${email}`);
    }catch(err){
      // creation might fail if user exists; still approval in DB succeeds.
      console.warn('Auth creation failed (create using Admin SDK if needed):', err.message);
      alert('Approved, but could not create Firebase Auth user from client. Use Admin SDK if necessary.');
    }
  }

  async function denyRegistration(studentId){
    await update(ref(db, `registrations/${studentId}`), { status:'denied', deniedAt: nowDate() });
    alert('Registration denied.');
  }

  /* Break Requests */
  function renderBreakRequests(data){
    breakRequestList.innerHTML = '';
    const items = [];
    for(const sid in data){
      const reqs = data[sid];
      for(const rid in reqs){
        const r = reqs[rid];
        r.studentId = sid; r.requestId = rid;
        items.push(r);
      }
    }
    if(items.length === 0){ breakRequestList.innerHTML = `<div class="small-muted">No break requests.</div>`; return; }
    items.forEach(r=>{
      const el = document.createElement('div');
      el.className = 'student-row';
      el.style.justifyContent = 'space-between';
      el.innerHTML = `<div><strong>${r.studentId}</strong><div class="small-muted">${r.months.map(m=>months[m]).join(', ')} • ${r.status}</div></div>
        <div style="display:flex;gap:8px;">
          <button class="btn small" data-act="approve" data-s="${r.studentId}" data-r="${r.requestId}">Approve</button>
          <button class="btn small ghost" data-act="deny" data-s="${r.studentId}" data-r="${r.requestId}">Deny</button>
        </div>`;
      breakRequestList.appendChild(el);
      el.querySelector('[data-act="approve"]').addEventListener('click', ()=> adminApproveBreak(r.studentId, r.requestId, r.months));
      el.querySelector('[data-act="deny"]').addEventListener('click', ()=> adminDenyBreak(r.studentId, r.requestId));
    });
  }

  async function adminApproveBreak(studentId, requestId, monthsArr){
    for(const m of monthsArr){
      await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${m+1}`), { status:'Break', date: nowDate(), method: '-', actionBy:'admin' });
    }
    await update(ref(db, `breakRequests/${studentId}/${requestId}`), { status:'approved', actionAt: nowDate() });
    alert('Break approved & applied.');
  }

  async function adminDenyBreak(studentId, requestId){
    await update(ref(db, `breakRequests/${studentId}/${requestId}`), { status:'denied', actionAt: nowDate() });
    alert('Break request denied.');
  }

  /* Tuition modal (simple prompt-based) */
  function openTuitionModalAdmin(studentId, name){
    (async ()=>{
      const upto = currentMonthIndex();
      const snap = await get(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}`));
      const data = snap.exists() ? snap.val() : {};
      let table = `Month | Status | Date & Method\n------------------------------\n`;
      for(let m=0;m<=upto;m++){
        const key = `m${m+1}`;
        const d = data && data[key] ? data[key] : null;
        const status = d ? d.status : 'Unpaid';
        const dm = d ? `${formatDate(d.date)} • ${d.method || '-'}` : '-';
        table += `${months[m]} | ${status} | ${dm}\n`;
      }
      const action = prompt(`Tuition for ${name} (${studentId})\n\n${table}\n\nActions:\n1 = Mark Paid\n2 = Mark Break\n3 = Undo\n\nEnter: action,monthIndex(1-12),e.g. "1,4" to mark April paid`, '');
      if(!action) return;
      const parts = action.split(',').map(s=>s.trim());
      const act = parts[0];
      const mnum = parseInt(parts[1]);
      if(!mnum || mnum<1 || mnum>12){ alert('Invalid month'); return; }
      if(act === '1'){
        const method = prompt('Payment method (e.g. Cash, bKash tx id):','Cash');
        await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${mnum}`), { status:'Paid', date: nowDate(), method, actionBy:'admin' });
        alert('Marked Paid');
      } else if(act === '2'){
        await set(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${mnum}`), { status:'Break', date: nowDate(), method:'-', actionBy:'admin' });
        alert('Marked Break');
      } else if(act === '3'){
        await remove(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}/m${mnum}`));
        alert('Undo performed');
      } else {
        alert('Unknown action');
      }
    })();
  }
}

/* ---------------- STUDENT PAGE LOGIC ---------------- */
if(isStudentPage){
  const sidInput = $('student-id');
  const spassInput = $('student-pass');
  const sSignIn = $('student-signin');
  const sSignOut = $('student-signout');
  const sAreas = $('student-areas');

  const tabs = document.querySelectorAll('.tab');
  const profileArea = $('profile-area');
  const tuitionArea = $('tuition-area');
  const breakArea = $('break-area');
  const sendBreakBtn = $('send-break');
  const breakResult = $('break-result');

  function showTab(target){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.student-content').forEach(c=>c.classList.add('hidden'));
    const btn = Array.from(tabs).find(t=>t.dataset.target === target);
    if(btn) btn.classList.add('active');
    $(target).classList.remove('hidden');
  }
  tabs.forEach(b=> b.addEventListener('click', ()=> showTab(b.dataset.target)) );

  sSignIn.addEventListener('click', async ()=>{
    const sid = sidInput.value.trim().toUpperCase();
    const pass = spassInput.value;
    if(!sid || !pass){ alert('Provide Student ID and password'); return; }
    const email = `${sid}@student.theacademiccare`;
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem('studentId', sid);
      sSignOut.classList.remove('hidden'); sSignIn.classList.add('hidden'); sAreas.classList.remove('hidden');
      loadStudentArea(sid);
    }catch(err){
      alert('Student sign-in failed: '+err.message);
    }
  });

  sSignOut.addEventListener('click', async ()=>{
    try{ await signOut(auth); sSignOut.classList.add('hidden'); sSignIn.classList.remove('hidden'); sAreas.classList.add('hidden'); }catch(e){console.error(e);}
  });

  async function loadStudentArea(studentId){
    // profile
    const snap = await get(ref(db, `students/${studentId}`));
    if(!snap.exists()){ profileArea.innerHTML = `<div class="small-muted">Profile not found or not yet approved.</div>`; return; }
    const p = snap.val();
    profileArea.innerHTML = `<p><strong>${p.name}</strong></p>
      <p>Student ID: ${p.studentId}</p>
      <p>Class: ${p.class}</p>
      <p>Roll: ${p.roll}</p>
      <p>WhatsApp: ${p.whatsapp}</p>`;

    // tuition (up to current month)
    const upto = currentMonthIndex();
    const tsnap = await get(ref(db, `tuition/${studentId}/${ACADEMIC_YEAR}`));
    const tdata = tsnap.exists() ? tsnap.val() : {};
    let html = `<table class="table"><thead><tr><th>Month</th><th>Status</th><th>Date & Method</th></tr></thead><tbody>`;
    for(let m=0;m<=upto;m++){
      const k = `m${m+1}`;
      const d = tdata && tdata[k] ? tdata[k] : null;
      let shtml = `<span class="status-pill unpaid">Unpaid</span>`, dm='-';
      if(d){
        if(d.status === 'Paid'){ shtml = `<span class="status-pill paid">Paid</span>`; dm = `${formatDate(d.date)} • ${d.method}`;}
        else if(d.status === 'Break'){ shtml = `<span class="status-pill break">Break</span>`; dm = `${formatDate(d.date)} • ${d.method}`;}
      }
      html += `<tr><td>${months[m]}</td><td>${shtml}</td><td>${dm}</td></tr>`;
    }
    html += `</tbody></table>`;
    tuitionArea.innerHTML = html;

    // break request UI for upcoming months
    const upcoming = [];
    for(let m=upto+1;m<12;m++) upcoming.push(m);
    if(upcoming.length === 0){ breakArea.innerHTML = `<div class="small-muted">No upcoming months.</div>`; sendBreakBtn.disabled = true; return; }
    breakArea.innerHTML = '';
    upcoming.forEach(m=>{
      const lbl = document.createElement('label');
      lbl.style.display = 'block';
      lbl.innerHTML = `<input type="checkbox" value="${m}"> ${months[m]}`;
      breakArea.appendChild(lbl);
    });
    sendBreakBtn.disabled = false;
    sendBreakBtn.onclick = async ()=>{
      const checked = Array.from(breakArea.querySelectorAll('input:checked')).map(i=>parseInt(i.value));
      if(checked.length === 0){ breakResult.innerText = 'Select at least one month'; return; }
      // push to /breakRequests/{studentId}/{pushId}
      const pushRef = push(ref(db, `breakRequests/${studentId}`));
      await set(pushRef, { months: checked, status:'pending', createdAt: nowDate() });
      breakResult.innerText = 'Break request submitted.';
      breakArea.querySelectorAll('input:checked').forEach(i=>i.checked=false);
    };
  }

  // if studentId stored in localStorage try auto-load
  const stored = localStorage.getItem('studentId');
  if(stored){ sidInput.value = stored; }
}
