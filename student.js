import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIMfGe50jxcyMV5lUqVsQUGSeZyLYpc84",
  authDomain: "the-academic-care-de611.firebaseapp.com",
  databaseURL: "https://the-academic-care-de611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-academic-care-de611",
  storageBucket: "the-academic-care-de611.firebasedatabase.app",
  messagingSenderId: "142271027321",
  appId: "1:142271027321:web:b26f1f255dd9d988f75ca8",
  measurementId: "G-Q7MCGKTYMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('studentId');

const tabs = document.querySelectorAll('.tabBtn');
const contents = document.querySelectorAll('.tabContent');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    contents.forEach(c => c.style.display='none');
    document.getElementById(tab.dataset.tab).style.display='block';
    if(tab.dataset.tab==='profile') loadProfile();
    if(tab.dataset.tab==='tuition') loadTuition();
    if(tab.dataset.tab==='breakRequest') loadBreakRequest();
  });
});

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  signOut(auth).then(()=>{window.location.href='index.html';});
});

async function loadProfile(){
  const profileDiv = document.getElementById('profile');
  const snapshot = await get(ref(db, 'students/' + studentId));
  if(snapshot.exists()){
    const s = snapshot.val();
    profileDiv.innerHTML = `<b>Name:</b> ${s.name}<br>
                            <b>Class:</b> ${s.class}<br>
                            <b>Roll:</b> ${s.roll}<br>
                            <b>WhatsApp:</b> ${s.whatsapp}`;
  }
}

async function loadTuition(){
  const tuitionDiv = document.getElementById('tuition');
  tuitionDiv.innerHTML = '<h3>Tuition Fee Status</h3>';
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const snapshot = await get(ref(db, 'tuition/'+studentId));
  months.forEach((m, idx)=>{
    if(idx <= new Date().getMonth()){
      let status = 'Unpaid', date='', method='';
      if(snapshot.exists() && snapshot.val()[m]){
        status = snapshot.val()[m].status;
        date = snapshot.val()[m].date;
        method = snapshot.val()[m].method;
      }
      tuitionDiv.innerHTML += `${m} - ${status} ${date} ${method}<br>`;
    }
  });
}

async function loadBreakRequest(){
  const breakDiv = document.getElementById('breakRequest');
  breakDiv.innerHTML = '<h3>Break Request</h3>';
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  months.forEach((m, idx)=>{
    if(idx > new Date().getMonth()){
      breakDiv.innerHTML += `${m} <button onclick="requestBreak('${m}')">Request Break</button><br>`;
    }
  });
}

window.requestBreak = async (month)=>{
  await update(ref(db, 'breakRequests/'+studentId+'/'+month), {requested:true, approved:false});
  alert('Break requested for '+month);
  loadBreakRequest();
};
