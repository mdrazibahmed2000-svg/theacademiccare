// Initialize Firebase references
const db = firebase.database();
const auth = firebase.auth();

// Tabs
const studentTabs = document.querySelectorAll('.studentTabBtn');
const studentContents = document.querySelectorAll('.studentTabContent');

// Logout
document.getElementById('logoutBtnStudent').addEventListener('click', () => {
    auth.signOut().then(() => location.href = 'index.html');
});

// Tab navigation
studentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        studentContents.forEach(tc => tc.style.display = 'none');
        document.getElementById(target).style.display = 'block';
    });
});

// Get student ID from login session (use localStorage or auth)
const studentId = localStorage.getItem('studentId'); 

// ==== My Profile ====
function loadProfile() {
    const profileRef = db.ref(`students/approved/${studentId}`);
    profileRef.once('value', snapshot => {
        const student = snapshot.val();
        if (student) {
            document.getElementById('profileName').textContent = student.name;
            document.getElementById('profileClass').textContent = student.class;
            document.getElementById('profileRoll').textContent = student.roll;
            document.getElementById('profileWhatsapp').textContent = student.whatsapp;
        }
    });
}

// ==== Tuition Fee Status ====
function loadTuition() {
    const tuitionRef = db.ref(`tuition/${studentId}`);
    const table = document.getElementById('tuitionTable');
    table.innerHTML = `<tr>
        <th>Month</th><th>Status</th><th>Date</th><th>Method</th>
    </tr>`;

    tuitionRef.on('value', snapshot => {
        const months = snapshot.val() || {};
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const today = new Date();

        // Up to current month only
        for (let i = 0; i <= today.getMonth(); i++) {
            const monthName = monthNames[i];
            const statusData = months[monthName] || {status:'Unpaid', date:'', method:''};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${monthName}</td>
                <td>${statusData.status}</td>
                <td>${statusData.date}</td>
                <td>${statusData.method}</td>
            `;
            table.appendChild(row);
        }
    });
}

// ==== Break Request ====
function loadBreakRequest() {
    const breakRef = db.ref(`breakRequests/${studentId}`);
    const breakContainer = document.getElementById('breakContainer');
    breakContainer.innerHTML = '';

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const today = new Date();
    
    // Upcoming months only
    for (let i = today.getMonth()+1; i < 12; i++) {
        const monthName = monthNames[i];
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="break_${monthName}" />
            <label for="break_${monthName}">${monthName}</label>
        `;
        breakContainer.appendChild(div);
    }

    // Submit Break Request
    document.getElementById('submitBreakBtn').addEventListener('click', () => {
        const checkedMonths = [];
        for (let i = today.getMonth()+1; i < 12; i++) {
            const monthName = monthNames[i];
            if (document.getElementById(`break_${monthName}`).checked) {
                checkedMonths.push(monthName);
            }
        }

        checkedMonths.forEach(month => {
            breakRef.child(month).set({requested:true});
        });
        alert('Break request submitted for selected months.');
    });
}

// ==== Initialize student panel ====
window.addEventListener('load', () => {
    if (!studentId) {
        alert('No student logged in');
        location.href = 'index.html';
        return;
    }

    loadProfile();
    loadTuition();
    loadBreakRequest();
});
