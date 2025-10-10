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

// Logout
document.getElementById('logoutBtnAdmin').addEventListener('click', () => {
    auth.signOut().then(() => location.href = 'index.html');
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

// Load Class sub-tabs dynamically
const classSubTabs = document.getElementById('classSubTabs');
const classContent = document.getElementById('classContent');
for (let i = 6; i <= 12; i++) {
    const btn = document.createElement('button');
    btn.textContent = `Class ${i}`;
    btn.addEventListener('click', () => loadClassStudents(i));
    classSubTabs.appendChild(btn);
}

// Load approved students in class
function loadClassStudents(cls) {
    classContent.innerHTML = '';
    db.ref('students').orderByChild('class').equalTo(String(cls)).once('value').then(snapshot => {
        snapshot.forEach(snap => {
            const student = snap.val();
            if (student.approved) {
                const div = document.createElement('div');
                div.innerHTML = `
                    ${student.name} (${snap.key}) - ${student.whatsapp} 
                    <button onclick="manageTuition('${snap.key}')">Tuition Status</button>
                `;
                classContent.appendChild(div);
            }
        });
    });
}

// Tuition management
function manageTuition(studentId) {
    const tuitionRef = db.ref(`tuition/${studentId}`);
    tuitionRef.once('value').then(snapshot => {
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const table = document.createElement('table');
        table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th><th>Action</th></tr>`;
        const today = new Date();
        for (let i = 0; i <= today.getMonth(); i++) {
            const month = monthNames[i];
            const data = snapshot.val()?.[month] || {status:'Unpaid', date:'', method:''};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${month}</td>
                <td>${data.status}</td>
                <td>${data.date}</td>
                <td>${data.method}</td>
                <td>
                    <button onclick="markPaid('${studentId}','${month}')">Mark Paid</button>
                    <button onclick="markBreak('${studentId}','${month}')">Mark Break</button>
                    <button onclick="undo('${studentId}','${month}')">Undo</button>
                </td>
            `;
            table.appendChild(row);
        }
        classContent.innerHTML = '';
        classContent.appendChild(table);
    });
}

// Mark Paid
window.markPaid = (studentId, month) => {
    const date = new Date().toLocaleDateString();
    const method = prompt("Enter Payment Method:");
    if (!method) return;
    db.ref(`tuition/${studentId}/${month}`).set({status:'Paid', date, method});
};

// Mark Break
window.markBreak = (studentId, month) => {
    db.ref(`tuition/${studentId}/${month}`).set({status:'Break', date:'', method:''});
};

// Undo
window.undo = (studentId, month) => {
    db.ref(`tuition/${studentId}/${month}`).set({status:'Unpaid', date:'', method:''});
};

// Load pending registrations
function loadRegistrations() {
    const regDiv = document.getElementById('registrationList');
    regDiv.innerHTML = '';
    db.ref('students').orderByChild('approved').equalTo(false).once('value').then(snapshot => {
        snapshot.forEach(snap => {
            const student = snap.val();
            const div = document.createElement('div');
            div.innerHTML = `
                ${student.name} (${snap.key}) - ${student.class} 
                <button onclick="approve('${snap.key}')">Approve</button>
                <button onclick="deny('${snap.key}')">Deny</button>
            `;
            regDiv.appendChild(div);
        });
    });
}
loadRegistrations();

// Approve student
window.approve = studentId => {
    db.ref(`students/${studentId}/approved`).set(true).then(() => loadRegistrations());
};

// Deny student
window.deny = studentId => {
    db.ref(`students/${studentId}`).remove().then(() => loadRegistrations());
};
