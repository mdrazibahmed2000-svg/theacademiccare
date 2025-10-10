// Firebase initialization
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const studentId = localStorage.getItem('studentId');
if (!studentId) location.href = 'index.html';

// Logout
document.getElementById('logoutBtnStudent').addEventListener('click', () => {
    localStorage.removeItem('studentId');
    location.href = 'index.html';
});

// Tab navigation
const tabs = document.querySelectorAll('.tabBtn');
const contents = document.querySelectorAll('.tabContent');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        contents.forEach(c => c.style.display = 'none');
        document.getElementById(tab.dataset.target).style.display = 'block';
    });
});

// Load Profile
db.ref(`students/${studentId}`).once('value').then(snap => {
    const student = snap.val();
    document.getElementById('profileInfo').innerHTML = `
        Name: ${student.name}<br>
        Class: ${student.class}<br>
        Roll: ${student.roll}<br>
        WhatsApp: ${student.whatsapp}<br>
        Student ID: ${studentId}
    `;
});

// Load Tuition Table
function loadTuition() {
    db.ref(`tuition/${studentId}`).once('value').then(snap => {
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const today = new Date();
        const table = document.createElement('table');
        table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th></tr>`;
        for (let i = 0; i <= today.getMonth(); i++) {
            const month = monthNames[i];
            const data = snap.val()?.[month] || {status:'Unpaid', date:'', method:''};
            const row = document.createElement('tr');
            row.innerHTML = `<td>${month}</td><td>${data.status}</td><td>${data.date}</td><td>${data.method}</td>`;
            table.appendChild(row);
        }
        const div = document.getElementById('tuitionTable');
        div.innerHTML = '';
        div.appendChild(table);
    });
}
loadTuition();

// Break Request for upcoming months
function loadBreakRequest() {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const today = new Date();
    const div = document.getElementById('breakRequestDiv');
    div.innerHTML = '';
    for (let i = today.getMonth()+1; i < 12; i++) {
        const month = monthNames[i];
        const btn = document.createElement('button');
        btn.textContent = `Request Break: ${month}`;
        btn.addEventListener('click', () => {
            db.ref(`breakRequests/${studentId}/${month}`).set({requested:true})
            .then(() => alert(`${month} break requested!`));
        });
        div.appendChild(btn);
    }
}
loadBreakRequest();
