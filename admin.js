// Firebase references
const db = firebase.database();
const auth = firebase.auth();

// Elements
const logoutBtn = document.getElementById('logoutBtn');
const tabs = document.querySelectorAll('.tab');
const subTabsContainer = document.getElementById('subTabsContainer');
const studentTableContainer = document.getElementById('studentTableContainer');
const registrationContainer = document.getElementById('registrationContainer');
const breakRequestsContainer = document.getElementById('breakRequestsContainer');

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => location.href = 'index.html');
});

// Tab click
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Hide all containers
        studentTableContainer.style.display = 'none';
        registrationContainer.style.display = 'none';
        breakRequestsContainer.style.display = 'none';
        subTabsContainer.innerHTML = '';

        if (tab.id === 'homeTab') return;

        if (tab.id === 'classTab') loadClassTabs();
        if (tab.id === 'registrationTab') loadRegistrations();
        if (tab.id === 'breakTab') loadBreakRequests();
    });
});

// Load Class Sub-tabs (6 to 12)
function loadClassTabs() {
    for (let i = 6; i <= 12; i++) {
        const btn = document.createElement('button');
        btn.textContent = `Class ${i}`;
        btn.addEventListener('click', () => loadStudentsByClass(i));
        subTabsContainer.appendChild(btn);
    }
}

// Load students by class
function loadStudentsByClass(classNumber) {
    studentTableContainer.innerHTML = '';
    studentTableContainer.style.display = 'block';

    db.ref('students').once('value', snapshot => {
        const students = snapshot.val();
        const table = document.createElement('table');
        table.innerHTML = `<tr>
            <th>Name</th><th>ID</th><th>WhatsApp</th><th>Tuition Status</th>
        </tr>`;

        for (const uid in students) {
            const student = students[uid];
            if (student.class == classNumber && student.approved) {
                const tr = document.createElement('tr');
                const tuitionBtn = document.createElement('button');
                tuitionBtn.textContent = 'Manage Tuition';
                tuitionBtn.addEventListener('click', () => manageTuition(uid, student.name));
                tr.innerHTML = `<td>${student.name}</td>
                                <td>${uid}</td>
                                <td>${student.whatsapp}</td>`;
                const td = document.createElement('td');
                td.appendChild(tuitionBtn);
                tr.appendChild(td);
                table.appendChild(tr);
            }
        }
        studentTableContainer.appendChild(table);
    });
}

// Manage tuition dynamically
function manageTuition(studentId, studentName) {
    const tuitionContainer = document.getElementById('tuitionContainer');
    tuitionContainer.innerHTML = `<h3>Tuition for ${studentName}</h3>`;
    const table = document.createElement('table');
    table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date & Method</th><th>Action</th></tr>`;

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    db.ref(`tuition/${studentId}`).once('value').then(snapshot => {
        const data = snapshot.val() || {};
        months.forEach(month => {
            const row = document.createElement('tr');
            const status = data[month]?.status || "Unpaid";
            const date = data[month]?.date || "";
            const method = data[month]?.method || "";
            row.innerHTML = `<td>${month}</td><td>${status}</td><td>${date} ${method}</td>`;

            const actionTd = document.createElement('td');
            if (!data[month]) {
                const paidBtn = document.createElement('button');
                paidBtn.textContent = 'Mark Paid';
                paidBtn.addEventListener('click', () => {
                    const paymentMethod = prompt("Enter payment method");
                    db.ref(`tuition/${studentId}/${month}`).set({
                        status: "Paid",
                        date: new Date().toLocaleDateString(),
                        method: paymentMethod
                    }).then(() => manageTuition(studentId, studentName));
                });
                const breakBtn = document.createElement('button');
                breakBtn.textContent = 'Mark Break';
                breakBtn.addEventListener('click', () => {
                    db.ref(`tuition/${studentId}/${month}`).set({
                        status: "Break",
                        date: "",
                        method: ""
                    }).then(() => manageTuition(studentId, studentName));
                });
                actionTd.appendChild(paidBtn);
                actionTd.appendChild(breakBtn);
            } else {
                const undoBtn = document.createElement('button');
                undoBtn.textContent = 'Undo';
                undoBtn.addEventListener('click', () => {
                    db.ref(`tuition/${studentId}/${month}`).remove().then(() => manageTuition(studentId, studentName));
                });
                actionTd.appendChild(undoBtn);
            }
            row.appendChild(actionTd);
            table.appendChild(row);
        });
    });

    tuitionContainer.appendChild(table);
}

// Load registrations for approval
function loadRegistrations() {
    registrationContainer.style.display = 'block';
    registrationContainer.innerHTML = '';
    db.ref('students').once('value', snapshot => {
        const students = snapshot.val();
        for (const uid in students) {
            const student = students[uid];
            if (!student.approved) {
                const div = document.createElement('div');
                div.textContent = `${student.name} (${student.class}-${student.roll})`;
                const approveBtn = document.createElement('button');
                approveBtn.textContent = 'Approve';
                approveBtn.addEventListener('click', () => {
                    db.ref(`students/${uid}/approved`).set(true).then(() => loadRegistrations());
                });
                const denyBtn = document.createElement('button');
                denyBtn.textContent = 'Deny';
                denyBtn.addEventListener('click', () => {
                    db.ref(`students/${uid}`).remove().then(() => loadRegistrations());
                });
                div.appendChild(approveBtn);
                div.appendChild(denyBtn);
                registrationContainer.appendChild(div);
            }
        }
    });
}

// Load break requests
function loadBreakRequests() {
    breakRequestsContainer.style.display = 'block';
    breakRequestsContainer.innerHTML = '';
    db.ref('breakRequests').once('value', snapshot => {
        const requests = snapshot.val();
        for (const uid in requests) {
            const studentReq = requests[uid];
            const studentNameRef = db.ref(`students/${uid}/name`);
            studentNameRef.once('value').then(snap => {
                const studentName = snap.val();
                for (const month in studentReq) {
                    if (studentReq[month].requested) {
                        const div = document.createElement('div');
                        div.textContent = `${studentName} requested break for ${month}`;
                        const approveBtn = document.createElement('button');
                        approveBtn.textContent = 'Approve';
                        approveBtn.addEventListener('click', () => {
                            db.ref(`tuition/${uid}/${month}`).set({
                                status: "Break",
                                date: "",
                                method: ""
                            }).then(() => db.ref(`breakRequests/${uid}/${month}`).remove().then(() => loadBreakRequests()));
                        });
                        const denyBtn = document.createElement('button');
                        denyBtn.textContent = 'Deny';
                        denyBtn.addEventListener('click', () => {
                            db.ref(`breakRequests/${uid}/${month}`).remove().then(() => loadBreakRequests());
                        });
                        div.appendChild(approveBtn);
                        div.appendChild(denyBtn);
                        breakRequestsContainer.appendChild(div);
                    }
                }
            });
        }
    });
}
