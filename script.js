// Ensure the global FB object (initialized in index.html) is available
if (typeof window.FB === 'undefined') {
    console.error("Firebase SDK not initialized. Make sure index.html loads and sets window.FB.");
}

const { 
    auth, db, ADMIN_UID, 
    signInWithEmailAndPassword, signOut, 
    createUserWithEmailAndPassword, onAuthStateChanged, 
    ref, set, get, child, onValue, update, remove 
} = window.FB || {};

// --- GLOBAL APP STATE AND CONSTANTS ---
const ACADEMIC_YEAR = 2025;
const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];
let currentStudentData = null; // Stores data for the currently logged-in student
let currentUserId = null; // Stores the Firebase UID of the logged-in user

// Reference to the root of the database structure
const DB_REF = ref(db); 

// --- UTILITY FUNCTIONS ---

/**
 * Displays a non-blocking notification message.
 * @param {string} message - The text to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showMessageBox(message, type = 'info') {
    const box = document.getElementById('message-box');
    box.textContent = message;
    
    // Reset classes
    box.className = 'fixed top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg text-white text-center z-50 transition-all duration-500 opacity-0 min-w-[300px]';
    
    let bgColor = '';
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500 shadow-xl';
            break;
        case 'error':
            bgColor = 'bg-red-500 shadow-xl';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-500 shadow-xl';
            break;
    }

    box.classList.add(bgColor, 'show');

    setTimeout(() => {
        box.classList.remove('show');
    }, 4000);
}

/**
 * Hides all main content panels and shows the target panel.
 * @param {string} panelId - The ID of the panel to show ('login-panel', 'admin-panel', 'student-panel', 'registration-panel').
 */
function switchPanel(panelId) {
    document.querySelectorAll('.app-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }
}

/**
 * Generates a unique Student ID based on year, class, and roll.
 * Format: S{Year}{Class:2d}{Roll:2d}
 * E.g., S20251015 (Year 2025, Class 10, Roll 15)
 * @param {string|number} studentClass 
 * @param {string|number} roll 
 * @returns {string} The generated student ID.
 */
function generateStudentId(studentClass, roll) {
    const classStr = String(studentClass).padStart(2, '0');
    const rollStr = String(roll).padStart(2, '0');
    return `S${ACADEMIC_YEAR}${classStr}${rollStr}`;
}

/**
 * Gets student data from the database using their generated student ID.
 * @param {string} studentId - The SXXXXXX ID.
 * @returns {Promise<object|null>} Student data or null if not found.
 */
async function getStudentDataById(studentId) {
    try {
        const snapshot = await get(child(DB_REF, `students/${studentId}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
    } catch (error) {
        console.error("Error fetching student data:", error);
    }
    return null;
}

// --- AUTHENTICATION & ROUTING ---

/**
 * Handles the main login process for both Admin and Students.
 */
window.handleLogin = async function() {
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!identifier || !password) {
        showMessageBox("Please enter both ID/Email and Password.", 'error');
        return;
    }

    try {
        let email = '';
        if (identifier.startsWith('S' + ACADEMIC_YEAR)) {
            // Student login: Student ID is used as the email prefix for security
            const studentId = identifier;
            const studentDetails = await getStudentDataById(studentId);
            
            if (!studentDetails || !studentDetails.uid) {
                showMessageBox("Student ID not found or registration pending approval.", 'error');
                return;
            }
            // Use the student's UID as the email address for Firebase Auth
            email = `${studentId}@theacademiccare.com`; 
            
        } else if (identifier.includes('@')) {
            // Admin login: Use the provided email
            email = identifier;
        } else {
            showMessageBox("Invalid identifier format. Use Student ID (SXXXXXX) or Admin Email.", 'error');
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener will handle the routing
    } catch (error) {
        console.error("Login failed:", error.code, error.message);
        let errorMessage = "Login failed. Check your ID/Email and password.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "User not found. Check your Student ID or Admin Email.";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Incorrect password.";
        }
        showMessageBox(errorMessage, 'error');
    }
}

/**
 * Handles user logout.
 */
window.handleLogout = async function() {
    try {
        await signOut(auth);
        currentStudentData = null;
        showMessageBox("Logged out successfully.", 'info');
    } catch (error) {
        console.error("Logout failed:", error);
        showMessageBox("Logout failed. Please try again.", 'error');
    }
}

/**
 * Main authentication state observer and router.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        
        if (user.uid === ADMIN_UID) {
            // --- ADMIN USER ---
            document.getElementById('admin-header-title').textContent = `Welcome Admin (${user.email})`;
            switchPanel('admin-panel');
            loadAdminPanel();
        } else {
            // --- STUDENT USER ---
            // Student ID is part of the email (e.g., S20251015@theacademiccare.com)
            const studentIdMatch = user.email.match(/^(\w+?@)/);
            const studentId = studentIdMatch ? studentIdMatch[1].slice(0, -1) : null;

            if (studentId) {
                const data = await getStudentDataById(studentId);
                if (data && data.uid === user.uid) {
                    currentStudentData = { studentId, ...data };
                    document.getElementById('student-header-title').textContent = `Welcome ${data.name} (${studentId})`;
                    switchPanel('student-panel');
                    loadStudentPanel();
                } else {
                    // This student ID is not registered or UID mismatch
                    await signOut(auth);
                    showMessageBox("Authentication error. Please re-login.", 'error');
                }
            } else {
                // Should not happen if login logic is correct
                await signOut(auth);
                showMessageBox("Invalid account type. Please re-login.", 'error');
            }
        }
    } else {
        // No user is signed in
        currentUserId = null;
        switchPanel('login-panel');
    }
});

// --- REGISTRATION LOGIC (STUDENT SIDE) ---

/**
 * Switches between login and registration panels.
 */
document.getElementById('register-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchPanel('registration-panel');
});
document.getElementById('back-to-login-reg')?.addEventListener('click', () => {
    switchPanel('login-panel');
});

/**
 * Handles the student registration submission.
 */
window.handleSubmitRegistration = async function() {
    const name = document.getElementById('reg-name').value.trim();
    const studentClass = document.getElementById('reg-class').value;
    const roll = document.getElementById('reg-roll').value;
    const whatsapp = document.getElementById('reg-whatsapp').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (!name || !studentClass || !roll || !whatsapp || !password || !confirmPassword) {
        showMessageBox("Please fill in all registration fields.", 'error');
        return;
    }
    if (password.length < 6) {
        showMessageBox("Password must be at least 6 characters.", 'error');
        return;
    }
    if (password !== confirmPassword) {
        showMessageBox("Password and confirm password do not match.", 'error');
        return;
    }
    
    // Generate the unique student ID
    const studentId = generateStudentId(studentClass, roll);
    
    // 1. Check if the Student ID (Class + Roll) already exists
    const existingStudent = await getStudentDataById(studentId);
    if (existingStudent) {
        showMessageBox(`Roll ${roll} in Class ${studentClass} is already registered.`, 'error');
        return;
    }

    try {
        // 2. Submit registration request to a pending queue (registrations/)
        const registrationRef = ref(db, 'registrations/' + studentId);
        await set(registrationRef, {
            name,
            class: studentClass,
            roll,
            whatsapp,
            password,
            date: new Date().toISOString()
        });
        
        document.getElementById('registration-form').reset();
        showMessageBox(`Registration request submitted! Your ID is: ${studentId}. Please wait for admin approval.`, 'success');
        switchPanel('login-panel');

    } catch (error) {
        console.error("Registration submission failed:", error);
        showMessageBox("Registration submission failed due to a database error. Please try again.", 'error');
    }
}


// --- ADMIN PANEL FUNCTIONS ---

/**
 * Initializes listeners and default view for the Admin panel.
 */
function loadAdminPanel() {
    // Set up tabs and default content
    document.querySelectorAll('.admin-main-tab').forEach(tab => {
        tab.classList.remove('active-tab');
        tab.addEventListener('click', handleAdminTabClick);
    });
    document.getElementById('admin-home-tab').classList.add('active-tab');
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));
    document.getElementById('admin-home-content').classList.remove('hidden');

    // Load data listeners for the tabs that require real-time updates
    setupAdminRegistrationListener();
    setupAdminBreakRequestListener();
}

/**
 * Handles clicks on the main admin navigation tabs.
 */
function handleAdminTabClick(event) {
    const tabId = event.target.id;
    const contentId = tabId.replace('-tab', '-content');

    // Update active tab styling
    document.querySelectorAll('.admin-main-tab').forEach(tab => tab.classList.remove('active-tab'));
    event.target.classList.add('active-tab');

    // Switch content panel
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(contentId).classList.remove('hidden');

    if (tabId === 'admin-class-tab') {
        loadClassSubTabs();
    }
}

/**
 * Generates and loads the class sub-tabs (6-12) for Class Management.
 */
function loadClassSubTabs() {
    const container = document.getElementById('admin-class-subtabs');
    container.innerHTML = ''; // Clear previous tabs

    for (let i = 6; i <= 12; i++) {
        const classNum = String(i);
        const btn = document.createElement('button');
        btn.textContent = `Class ${classNum}`;
        btn.className = 'admin-sub-tab';
        btn.dataset.class = classNum;
        btn.onclick = () => handleClassSubTabClick(classNum, btn);
        container.appendChild(btn);
    }
    
    // Auto-click the first tab (Class 6)
    const firstTab = container.querySelector('button');
    if (firstTab) {
        firstTab.click();
    }
}

/**
 * Handles clicks on Class sub-tabs (6-12).
 * @param {string} classNum 
 * @param {HTMLButtonElement} button 
 */
function handleClassSubTabClick(classNum, button) {
    // Update active sub-tab styling
    document.querySelectorAll('.admin-sub-tab').forEach(btn => btn.classList.remove('active-sub-tab'));
    button.classList.add('active-sub-tab');

    // Load students for the selected class
    setupClassStudentListener(classNum);
}

/**
 * Sets up a real-time listener for students in a specific class.
 * @param {string} classNum 
 */
function setupClassStudentListener(classNum) {
    const container = document.getElementById('admin-class-student-list');
    container.innerHTML = `<p class="text-center text-blue-500 p-4">Loading students for Class ${classNum}...</p>`;
    
    // Fetch all approved student data
    onValue(child(DB_REF, 'students'), (snapshot) => {
        const allStudents = snapshot.val() || {};
        const classStudents = Object.values(allStudents)
            .filter(s => s.class === classNum)
            .sort((a, b) => parseInt(a.roll) - parseInt(b.roll));

        renderClassStudents(classStudents, classNum);
    }, {
        onlyOnce: false // Keep listening for changes
    });
}

/**
 * Renders the list of approved students for a class.
 * @param {Array<object>} students 
 * @param {string} classNum
 */
function renderClassStudents(students, classNum) {
    const container = document.getElementById('admin-class-student-list');
    container.innerHTML = '';
    
    if (students.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-4">No students approved for Class ${classNum} yet.</p>`;
        return;
    }

    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200';
        
        const infoHtml = `
            <div class="mb-2 sm:mb-0 text-center sm:text-left">
                <p class="font-bold text-lg text-gray-800">${student.name}</p>
                <p class="text-sm text-gray-600">ID: ${student.studentId} | Roll: ${student.roll}</p>
                <p class="text-sm text-gray-500">WhatsApp: ${student.whatsapp}</p>
            </div>
            <button onclick="openFeeManagementModal('${student.studentId}', '${student.name}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 w-full sm:w-auto mt-2 sm:mt-0">
                Tuition Fee Status
            </button>
        `;
        card.innerHTML = infoHtml;
        container.appendChild(card);
    });
}

/**
 * Opens the Fee Management Modal for a specific student.
 * @param {string} studentId 
 * @param {string} studentName 
 */
window.openFeeManagementModal = async function(studentId, studentName) {
    document.getElementById('fee-modal-title').textContent = `${studentName}'s Fee Status (${studentId})`;
    document.getElementById('fee-management-modal').classList.remove('hidden');
    
    const body = document.getElementById('fee-modal-body');
    body.innerHTML = '<p class="text-center p-8 text-blue-500">Loading fee data...</p>';

    // Use onValue listener for real-time fee updates in the modal
    const feeRef = child(DB_REF, `students/${studentId}/fees`);
    onValue(feeRef, (snapshot) => {
        const fees = snapshot.val() || {};
        renderFeeTable(studentId, fees, body, 'admin');
    }, {
        onlyOnce: false // Keep listening for changes while modal is open
    });
}

/**
 * Renders the Fee Status Table. Used by both Admin Modal and Student Panel.
 * @param {string} studentId 
 * @param {object} fees 
 * @param {HTMLElement} container 
 * @param {string} userRole - 'admin' or 'student'
 */
function renderFeeTable(studentId, fees, container, userRole) {
    const currentMonthIndex = new Date().getMonth();
    let tableHtml = `<div class="max-h-[60vh] overflow-y-auto"><table class="fee-table min-w-full">
        <thead>
            <tr>
                <th>Month</th>
                <th>Status</th>
                <th>Date & Method</th>
                ${userRole === 'admin' ? '<th>Action</th>' : ''}
            </tr>
        </thead>
        <tbody>`;

    MONTHS.forEach((month, index) => {
        const fee = fees[month] || { status: 'Unpaid', date: '', method: '' };
        const statusColor = fee.status === 'Paid' ? 'text-green-600 font-medium' :
                            fee.status === 'Break' ? 'text-yellow-600 font-medium' : 
                            'text-red-600 font-medium';
        
        const isPastOrCurrentMonth = index <= currentMonthIndex;
        let actionButtons = '';

        if (userRole === 'admin' && isPastOrCurrentMonth) {
            actionButtons = `
                <div class="flex space-x-2">
                    <button onclick="markFee('${studentId}', '${month}', 'Paid')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-md shadow-md">
                        Mark Paid
                    </button>
                    <button onclick="markFee('${studentId}', '${month}', 'Break')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs rounded-md shadow-md">
                        Mark Break
                    </button>
                    ${fee.status !== 'Unpaid' ? `
                        <button onclick="markFee('${studentId}', '${month}', 'Unpaid')" class="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 text-xs rounded-md shadow-md">
                            Undo
                        </button>
                    ` : ''}
                </div>
            `;
        }

        tableHtml += `
            <tr>
                <td class="${isPastOrCurrentMonth ? 'font-semibold' : 'text-gray-400'}">${month}</td>
                <td class="${statusColor}">${fee.status}</td>
                <td class="text-sm text-gray-700">${fee.date || 'N/A'} ${fee.method ? `(${fee.method})` : ''}</td>
                ${userRole === 'admin' ? `<td>${actionButtons}</td>` : ''}
            </tr>
        `;
    });

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;
}

/**
 * Closes the fee management modal.
 */
window.closeFeeManagementModal = function() {
    // Stop the listener before closing the modal (optional optimization)
    // For simplicity, we skip manually detaching the listener, as the app re-initializes on tab switch.
    document.getElementById('fee-management-modal').classList.add('hidden');
}

/**
 * Admin action to mark a student's fee status for a month.
 * @param {string} studentId 
 * @param {string} month 
 * @param {string} status - 'Paid', 'Break', or 'Unpaid'
 */
window.markFee = async function(studentId, month, status) {
    const feeRef = child(DB_REF, `students/${studentId}/fees/${month}`);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const method = status === 'Paid' ? 'Cash/Bkash' : ''; // Admin assumed to know method if paid

    try {
        if (status === 'Unpaid') {
            await remove(feeRef); // Delete the entry to reset it to default
            showMessageBox(`Fee for ${month} for ${studentId} marked as Unpaid (Undo).`, 'info');
        } else {
            await set(feeRef, {
                status: status,
                date: status === 'Paid' ? dateStr : '',
                method: status === 'Paid' ? method : '',
                markedBy: currentUserId, // Admin UID
                timestamp: now.toISOString()
            });
            showMessageBox(`Fee for ${month} for ${studentId} marked as ${status}.`, 'success');
        }
    } catch (error) {
        console.error("Error marking fee:", error);
        showMessageBox(`Failed to mark fee for ${month}.`, 'error');
    }
}

// --- ADMIN: REGISTRATION REQUESTS ---

/**
 * Sets up a real-time listener for pending registration requests.
 */
function setupAdminRegistrationListener() {
    const container = document.getElementById('admin-registration-requests');
    onValue(child(DB_REF, 'registrations'), (snapshot) => {
        const requests = snapshot.val() || {};
        renderRegistrationRequests(requests, container);
    }, {
        onlyOnce: false
    });
}

/**
 * Renders the pending registration requests.
 * @param {object} requests 
 * @param {HTMLElement} container 
 */
function renderRegistrationRequests(requests, container) {
    container.innerHTML = '';
    const studentIds = Object.keys(requests);
    
    if (studentIds.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-4">No pending registration requests.</p>`;
        return;
    }

    studentIds.forEach(studentId => {
        const request = requests[studentId];
        const card = document.createElement('div');
        card.className = 'p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm';
        
        const html = `
            <p class="font-bold text-lg text-gray-800">${request.name}</p>
            <p class="text-sm text-gray-600">ID: <span class="font-mono">${studentId}</span> | Class: ${request.class} | Roll: ${request.roll}</p>
            <p class="text-sm text-gray-600">WhatsApp: ${request.whatsapp}</p>
            <p class="text-xs text-gray-500 mt-1">Submitted: ${new Date(request.date).toLocaleString()}</p>
            <div class="mt-4 flex space-x-3">
                <button onclick="approveRegistration('${studentId}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition duration-200">
                    Approve
                </button>
                <button onclick="denyRegistration('${studentId}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition duration-200">
                    Deny
                </button>
            </div>
        `;
        card.innerHTML = html;
        container.appendChild(card);
    });
}

/**
 * Admin action to approve a registration request.
 * @param {string} studentId 
 */
window.approveRegistration = async function(studentId) {
    const regRef = child(DB_REF, `registrations/${studentId}`);
    const studentDataSnapshot = await get(regRef);
    const request = studentDataSnapshot.val();

    if (!request) {
        showMessageBox("Request not found.", 'error');
        return;
    }

    try {
        // 1. Create the student in Firebase Auth (Using ID as email prefix)
        const email = `${studentId}@theacademiccare.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, request.password);
        const uid = userCredential.user.uid;

        // 2. Move data to approved students/ (students/{studentId})
        const studentRef = child(DB_REF, `students/${studentId}`);
        await set(studentRef, {
            uid,
            studentId,
            name: request.name,
            class: request.class,
            roll: request.roll,
            whatsapp: request.whatsapp,
            status: 'Approved',
            dateApproved: new Date().toISOString()
        });

        // 3. Delete the request from registrations/
        await remove(regRef);

        showMessageBox(`Registration for ${request.name} (${studentId}) approved!`, 'success');
    } catch (error) {
        console.error("Approval failed:", error.code, error.message);
        let errorMessage = "Registration approval failed.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Student account already exists. Deleting pending request.";
            await remove(regRef); // Clean up pending request if account already made
        }
        showMessageBox(errorMessage, 'error');
    }
}

/**
 * Admin action to deny a registration request.
 * @param {string} studentId 
 */
window.denyRegistration = async function(studentId) {
    try {
        const regRef = child(DB_REF, `registrations/${studentId}`);
        await remove(regRef);
        showMessageBox(`Registration request for ${studentId} denied and removed.`, 'info');
    } catch (error) {
        console.error("Denial failed:", error);
        showMessageBox("Failed to deny registration.", 'error');
    }
}

// --- ADMIN: BREAK REQUESTS ---

/**
 * Sets up a real-time listener for pending break requests.
 */
function setupAdminBreakRequestListener() {
    const container = document.getElementById('admin-break-requests');
    onValue(child(DB_REF, 'break_requests'), (snapshot) => {
        const requests = snapshot.val() || {};
        renderBreakRequests(requests, container);
    }, {
        onlyOnce: false
    });
}

/**
 * Renders the pending break requests.
 * @param {object} requests 
 * @param {HTMLElement} container 
 */
function renderBreakRequests(requests, container) {
    container.innerHTML = '';
    const requestKeys = Object.keys(requests);

    if (requestKeys.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-4">No pending break requests.</p>`;
        return;
    }

    requestKeys.forEach(key => {
        const request = requests[key];
        const card = document.createElement('div');
        card.className = 'p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm';
        
        const html = `
            <p class="font-bold text-lg text-gray-800">${request.studentName} (${request.studentId})</p>
            <p class="text-sm text-gray-600">Month: <span class="font-semibold">${request.month}</span></p>
            <p class="text-sm text-gray-600">Reason: ${request.reason}</p>
            <p class="text-xs text-gray-500 mt-1">Submitted: ${new Date(request.date).toLocaleString()}</p>
            <div class="mt-4 flex space-x-3">
                <button onclick="approveBreak('${request.studentId}', '${request.month}', '${key}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition duration-200">
                    Approve (Mark Break)
                </button>
                <button onclick="denyBreak('${key}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition duration-200">
                    Deny
                </button>
            </div>
        `;
        card.innerHTML = html;
        container.appendChild(card);
    });
}

/**
 * Admin action to approve a break request, marking the month as 'Break' and removing the request.
 * @param {string} studentId 
 * @param {string} month 
 * @param {string} requestKey 
 */
window.approveBreak = async function(studentId, month, requestKey) {
    try {
        // 1. Mark fee as 'Break'
        await markFee(studentId, month, 'Break');

        // 2. Remove the request
        await remove(child(DB_REF, `break_requests/${requestKey}`));

        showMessageBox(`Break request for ${studentId} in ${month} approved and fee marked as Break.`, 'success');
    } catch (error) {
        console.error("Break approval failed:", error);
        showMessageBox("Failed to approve break request.", 'error');
    }
}

/**
 * Admin action to deny a break request.
 * @param {string} requestKey 
 */
window.denyBreak = async function(requestKey) {
    try {
        await remove(child(DB_REF, `break_requests/${requestKey}`));
        showMessageBox("Break request denied and removed.", 'info');
    } catch (error) {
        console.error("Break denial failed:", error);
        showMessageBox("Failed to deny break request.", 'error');
    }
}

// --- STUDENT PANEL FUNCTIONS ---

/**
 * Initializes and routes the student panel content.
 */
function loadStudentPanel() {
    // Set up tabs
    document.querySelectorAll('#student-tabs .admin-main-tab').forEach(tab => {
        tab.classList.remove('active-tab');
    });
    document.querySelector('#student-tabs button').classList.add('active-tab'); // Default to My Profile
    
    // Set up content
    document.querySelectorAll('.student-content').forEach(content => content.classList.add('hidden'));
    document.getElementById('student-my-profile-content').classList.remove('hidden');

    // Load initial content
    renderStudentProfile();
    renderStudentFeeStatus();
    renderBreakRequestForm();
}

/**
 * Handles clicks on student navigation tabs.
 * @param {string} tabName - 'my-profile', 'tuition-fee-status', 'break-request'
 */
window.handleStudentTabClick = function(tabName) {
    // Update active tab styling
    document.querySelectorAll('#student-tabs .admin-main-tab').forEach(tab => tab.classList.remove('active-tab'));
    document.querySelector(`#student-tabs button[onclick*="${tabName}"]`).classList.add('active-tab');

    // Switch content panel
    document.querySelectorAll('.student-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`student-${tabName}-content`).classList.remove('hidden');
}

/**
 * Renders the student's profile information.
 */
function renderStudentProfile() {
    const student = currentStudentData;
    const container = document.getElementById('student-my-profile-content');
    
    if (!student) {
        container.innerHTML = '<p class="text-center text-red-500 p-4">Error: Student data not loaded.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-blue-700">My Profile</h3>
        <div class="space-y-4 max-w-lg">
            <div class="p-3 bg-gray-50 rounded-lg border">
                <p class="text-sm text-gray-500">Full Name</p>
                <p class="font-semibold text-lg">${student.name}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border">
                <p class="text-sm text-gray-500">Student ID</p>
                <p class="font-semibold text-lg">${student.studentId}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-gray-50 rounded-lg border">
                    <p class="text-sm text-gray-500">Class</p>
                    <p class="font-semibold text-lg">${student.class}</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg border">
                    <p class="text-sm text-gray-500">Roll Number</p>
                    <p class="font-semibold text-lg">${student.roll}</p>
                </div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border">
                <p class="text-sm text-gray-500">WhatsApp Number</p>
                <p class="font-semibold text-lg">${student.whatsapp}</p>
            </div>
        </div>
        <div class="mt-6 p-4 bg-yellow-100 rounded-lg">
            <p class="text-sm text-gray-700 font-medium">Forgot Password?</p>
            <p class="text-xs text-gray-600">Please contact the admin via WhatsApp (${student.whatsapp}) to reset your password. Note: Your login ID is your Student ID.</p>
        </div>
    `;
}

/**
 * Sets up a real-time listener for the student's fee status.
 */
function renderStudentFeeStatus() {
    const student = currentStudentData;
    const container = document.getElementById('student-tuition-fee-status-content');
    container.className = 'student-content p-6 bg-white rounded-xl shadow-lg'; // Ensure styling is applied

    if (!student) return;

    container.innerHTML = '<p class="text-center p-8 text-blue-500">Loading fee status...</p>';

    const feeRef = child(DB_REF, `students/${student.studentId}/fees`);
    onValue(feeRef, (snapshot) => {
        const fees = snapshot.val() || {};
        const tableContainer = document.createElement('div');
        tableContainer.innerHTML = `<h3 class="text-xl font-bold mb-4 text-blue-700">Monthly Tuition Fee Status - ${ACADEMIC_YEAR}</h3>`;
        
        renderFeeTable(student.studentId, fees, tableContainer, 'student');
        container.innerHTML = '';
        container.appendChild(tableContainer);

    }, {
        onlyOnce: false
    });
}

/**
 * Renders the break request form.
 */
function renderBreakRequestForm() {
    const container = document.getElementById('student-break-request-content');
    
    // Generate options for current/future months
    const currentMonthIndex = new Date().getMonth();
    let monthOptions = '';
    MONTHS.forEach((month, index) => {
        if (index >= currentMonthIndex) {
            monthOptions += `<option value="${month}">${month}</option>`;
        }
    });

    container.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-blue-700">Submit Break Request</h3>
        <p class="mb-4 text-gray-600">Request a temporary break from tuition for an upcoming month. All requests require admin approval.</p>
        <form id="break-request-form" class="space-y-4 max-w-lg">
            <div>
                <label for="break-month" class="block text-sm font-medium text-gray-700 mb-1">Select Month (Current or Future)</label>
                <select id="break-month" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    <option value="" disabled selected>Select a month</option>
                    ${monthOptions}
                </select>
            </div>
            <div>
                <label for="break-reason" class="block text-sm font-medium text-gray-700 mb-1">Reason for Break</label>
                <textarea id="break-reason" rows="4" placeholder="Briefly explain the reason for your break." required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <button type="submit" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-md transition duration-200">
                Submit Request
            </button>
        </form>
    `;
    
    document.getElementById('break-request-form').addEventListener('submit', submitBreakRequest);
}

/**
 * Handles the submission of a student break request.
 * @param {Event} e 
 */
async function submitBreakRequest(e) {
    e.preventDefault();
    const student = currentStudentData;
    if (!student) return;

    const month = document.getElementById('break-month').value;
    const reason = document.getElementById('break-reason').value.trim();

    if (!month || !reason) {
        showMessageBox("Please select a month and provide a reason.", 'error');
        return;
    }

    try {
        // Check if a request for this month already exists
        const existingRequests = await get(child(DB_REF, 'break_requests'));
        let requestExists = false;
        existingRequests.forEach(snap => {
            const req = snap.val();
            if (req.studentId === student.studentId && req.month === month) {
                requestExists = true;
            }
        });
        
        if (requestExists) {
            showMessageBox(`A break request for ${month} is already pending or processed.`, 'info');
            return;
        }

        // Add request to the 'break_requests' queue
        const newRequestRef = push(child(DB_REF, 'break_requests'));
        await set(newRequestRef, {
            studentId: student.studentId,
            studentName: student.name,
            month: month,
            reason: reason,
            date: new Date().toISOString()
        });
        
        document.getElementById('break-request-form').reset();
        showMessageBox(`Break request for ${month} submitted successfully! Awaiting admin approval.`, 'success');
    } catch (error) {
        console.error("Break request submission failed:", error);
        showMessageBox("Failed to submit break request.", 'error');
    }
}

// Attach push function to global FB for the break request submission

// --- INITIALIZATION ---
// Start observing authentication state to route the user
// (The onAuthStateChanged call handles the initial routing)
