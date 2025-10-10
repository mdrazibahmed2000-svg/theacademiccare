// Initialize Firebase references
const db = firebase.database();
const auth = firebase.auth();
const adminUID = "xg4XNMsSJqbXMZ57qicrpgfM6Yn1"; // Admin UID

// Tabs
const tabs = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');

// Logout
document.getElementById('logoutBtnAdmin').addEventListener('click', () => {
    auth.signOut().then(() => location.href = 'index.html');
});

// Tab navigation
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        tabContents.forEach(tc => tc.style.display = 'none');
        document.getElementById(target).style.display = 'block';
    });
});

// ==== Registration Tab ====
const registrationTable = document.getElementById('registrationTable');

function loadPendingRegistrations() {
    const pendingRef = db.ref('students/pending');
    pendingRef.on('value', snapshot => {
        registrationTable.innerHTML = '';
        const pendingList = snapshot.val();
        if (pendingList) {
            Object.keys(pendingList).forEach(studentId => {
                const student = pendingList[studentId];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${student.roll}</td>
                    <td>${student.whatsapp}</td>
                    <td>
                        <button class="approve">Approve</button>
                        <button class="deny">Deny</button>
                    </td>
                `;
                registrationTable.appendChild(row);

                // Approve
                row.querySelector('.approve').addEventListener('click', () => {
                    db.ref(`students/approved/${studentId}`).set(student);
                    db.ref(`students/pending/${studentId}`).remove();
                });

                // Deny
                row.querySelector('.deny').addEventListener('click', () => {
                    db.ref(`students/pending/${studentId}`).remove();
                });
            });
        }
    });
}

loadPendingRegistrations();

// ==== Class Tab ====
const classTabs = document.querySelectorAll('.subTabBtn');
const classContents = document.querySelectorAll('.classContent');

classTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        classContents.forEach(cc => cc.style.display = 'none');
        document.getElementById(target).style.display = 'block';
        loadClassStudents(target);
    });
});

function loadClassStudents(className) {
    const classRef = db.ref('students/approved');
    const container = document.getElementById(className);
    container.innerHTML = '';

    classRef.on('value', snapshot => {
        const students = snapshot.val();
        if (students) {
            Object.keys(students).forEach(studentId => {
                const student = students[studentId];
                if (student.class === className.replace('Class', '').trim()) {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <span>${student.name} (${studentId}) - ${student.whatsapp}</span>
                        <button class="tuitionBtn">Tuition Status</button>
                        <div class="tuitionTable" style="display:none;">
                            <table>
                                <tr>
                                    <th>Month</th><th>Status</th><th>Date</th><th>Method</th><th>Action</th>
                                </tr>
                            </table>
                        </div>
                    `;
                    container.appendChild(div);

                    const tuitionBtn = div.querySelector('.tuitionBtn');
                    const tuitionTable = div.querySelector('.tuitionTable');
                    tuitionBtn.addEventListener('click', () => {
                        tuitionTable.style.display = tuitionTable.style.display === 'none' ? 'block' : 'none';
                        loadTuitionStatus(studentId, tuitionTable.querySelector('table'));
                    });
                }
            });
        }
    });
}

// ==== Tuition Status ====
function loadTuitionStatus(studentId, table) {
    table.innerHTML = `<tr>
        <th>Month</th><th>Status</th><th>Date</th><th>Method</th><th>Action</th>
    </tr>`;
    const tuitionRef = db.ref(`tuition/${studentId}`);
    tuitionRef.once('value', snapshot => {
        const months = snapshot.val() || {};
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const today = new Date();
        for (let i = 0; i <= today.getMonth(); i++) {
            const monthName = monthNames[i];
            const statusData = months[monthName] || {status:'Unpaid', date:'', method:''};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${monthName}</td>
                <td>${statusData.status}</td>
                <td>${statusData.date}</td>
                <td>${statusData.method}</td>
                <td>
                    <button class="markPaid">Mark Paid</button>
                    <button class="markBreak">Mark Break</button>
                    <button class="undo" style="display:none;">Undo</button>
                </td>
            `;
            table.appendChild(row);

            const markPaid = row.querySelector('.markPaid');
            const markBreak = row.querySelector('.markBreak');
            const undoBtn = row.querySelector('.undo');

            markPaid.addEventListener('click', () => {
                const method = prompt("Enter Payment Method:");
                if (method) {
                    tuitionRef.child(monthName).set({
                        status: 'Paid',
                        date: new Date().toLocaleDateString(),
                        method: method
                    });
                    row.cells[1].textContent = 'Paid';
                    row.cells[2].textContent = new Date().toLocaleDateString();
                    row.cells[3].textContent = method;
                    markPaid.style.display = 'none';
                    markBreak.style.display = 'none';
                    undoBtn.style.display = 'inline-block';
                }
            });

            markBreak.addEventListener('click', () => {
                tuitionRef.child(monthName).set({
                    status: 'Break',
                    date: '',
                    method: ''
                });
                row.cells[1].textContent = 'Break';
                row.cells[2].textContent = '';
                row.cells[3].textContent = '';
                markPaid.style.display = 'none';
                markBreak.style.display = 'none';
                undoBtn.style.display = 'inline-block';
            });

            undoBtn.addEventListener('click', () => {
                tuitionRef.child(monthName).set({
                    status: 'Unpaid',
                    date: '',
                    method: ''
                });
                row.cells[1].textContent = 'Unpaid';
                row.cells[2].textContent = '';
                row.cells[3].textContent = '';
                markPaid.style.display = 'inline-block';
                markBreak.style.display = 'inline-block';
                undoBtn.style.display = 'none';
            });
        }
    });
}
