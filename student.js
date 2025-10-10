const auth = firebase.auth();
const db = firebase.database();

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => location.href = 'index.html');
});

const tabs = document.querySelectorAll('.tab');
const profileContainer = document.getElementById('profileContainer');
const tuitionContainer = document.getElementById('tuitionContainer');
const breakContainer = document.getElementById('breakContainer');

const studentId = localStorage.getItem('studentId');

// Tab click events
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        profileContainer.style.display = 'none';
        tuitionContainer.style.display = 'none';
        breakContainer.style.display = 'none';

        if (tab.id === 'homeTab') return;
        if (tab.id === 'profileTab') loadProfile();
        if (tab.id === 'tuitionTab') loadTuition();
        if (tab.id === 'breakTab') loadBreakRequests();
    });
});

// Load profile
function loadProfile() {
    profileContainer.style.display = 'block';
    db.ref(`students/${studentId}`).once('value').then(snap => {
        const student = snap.val();
        profileContainer.innerHTML = `
            <p>Name: ${student.name}</p>
            <p>Class: ${student.class}</p>
            <p>Roll: ${student.roll}</p>
            <p>WhatsApp: ${student.whatsapp}</p>
        `;
    });
}

// Load tuition
function loadTuition() {
    tuitionContainer.style.display = 'block';
    tuitionContainer.innerHTML = '';
    const table = document.createElement('table');
    table.innerHTML = `<tr><th>Month</th><th>Status</th><th>Date & Method</th></tr>`;

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    db.ref(`tuition/${studentId}`).once('value').then(snapshot => {
        const data = snapshot.val() || {};
        const currentMonthIndex = new Date().getMonth();
        months.forEach((month, idx) => {
            if (idx > currentMonthIndex) return; // Only up to current month
            const row = document.createElement('tr');
            const status = data[month]?.status || "Unpaid";
            const date = data[month]?.date || "";
            const method = data[month]?.method || "";
            row.innerHTML = `<td>${month}</td><td>${status}</td><td>${date} ${method}</td>`;
            table.appendChild(row);
        });
    });

    tuitionContainer.appendChild(table);
}

// Load break requests
function loadBreakRequests() {
    breakContainer.style.display = 'block';
    breakContainer.innerHTML = '';
    const table = document.createElement('table');
    table.innerHTML = `<tr><th>Month</th><th>Request Break</th></tr>`;

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const currentMonthIndex = new Date().getMonth();

    months.forEach((month, idx) => {
        if (idx <= currentMonthIndex) return; // Only upcoming months
        const row = document.createElement('tr');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            db.ref(`breakRequests/${studentId}/${month}`).set({requested: checkbox.checked});
        });
        row.innerHTML = `<td>${month}</td>`;
        const td = document.createElement('td');
        td.appendChild(checkbox);
        row.appendChild(td);
        table.appendChild(row);
    });

    breakContainer.appendChild(table);
}
