document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultUsers();
    protectPage();
    updateAuthUI();
    setupLoginForm();
    setupRegisterForm();
    setupForgotPasswordForm();
    setupPasswordToggle();
    setupFormListener();
    loadComplaints();
    loadDashboardData();
    loadHomeStats();
});

function initializeDefaultUsers() {
    const defaultUsers = [
        { name: 'Admin User', email: 'admin@complaint.com', password: 'admin123', role: 'Admin' },
        { name: 'System User', email: 'user@complaint.com', password: 'user123', role: 'User' }
    ];

    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const mergedUsers = [...storedUsers];

    defaultUsers.forEach(defaultUser => {
        if (!mergedUsers.some(user => user.email === defaultUser.email)) {
            mergedUsers.push(defaultUser);
        }
    });

    localStorage.setItem('registeredUsers', JSON.stringify(mergedUsers));
}

function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
}

function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function protectPage() {
    const isProtected = document.body.dataset.protected === 'true';
    if (isProtected && !isUserLoggedIn()) {
        window.location.href = 'login.html';
    }
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    if (!authLink) return;

    if (isUserLoggedIn()) {
        authLink.textContent = 'Logout';
        authLink.href = '#';
        authLink.addEventListener('click', event => {
            event.preventDefault();
            logoutUser();
        });
    } else {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.reset();

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        loginUser();
    });
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', event => {
        event.preventDefault();
        registerUser();
    });
}

function setupForgotPasswordForm() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', event => {
        event.preventDefault();
        requestPasswordReset();
    });
}

function setupPasswordToggle() {
    const toggleButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');

    if (!toggleButton || !passwordInput) return;

    toggleButton.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleButton.textContent = isPassword ? '🙈' : '👁';
    });
}

function loginUser() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!email || !password) {
        showFormMessage('loginStatus', 'Please enter email and password.', true);
        return;
    }

    const users = getRegisteredUsers();
    const matchedUser = users.find(user => user.email === email && user.password === password);

    if (!matchedUser) {
        showFormMessage('loginStatus', 'Invalid login. Please check your email and password.', true);
        return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loggedInUser', matchedUser.email);
    localStorage.setItem('userRole', matchedUser.role || 'User');
    showFormMessage('loginStatus', 'Login successful. Redirecting...', false);

    setTimeout(() => {
        window.location.href = (matchedUser.role || 'User') === 'Admin' ? 'dashboard.html' : 'home.html';
    }, 700);
}

function registerUser() {
    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

    if (!name || !email || !password || !confirmPassword) {
        showFormMessage('registerStatus', 'Please complete all registration fields.', true);
        return;
    }

    if (password !== confirmPassword) {
        showFormMessage('registerStatus', 'Passwords do not match.', true);
        return;
    }

    const users = getRegisteredUsers();
    if (users.some(user => user.email === email)) {
        showFormMessage('registerStatus', 'An account with this email already exists.', true);
        return;
    }

    users.push({ name, email, password, role: 'User' });
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loggedInUser', email);
    localStorage.setItem('userRole', 'User');
    showFormMessage('registerStatus', 'Registration successful. Redirecting to home...', false);

    setTimeout(() => {
        window.location.href = 'home.html';
    }, 800);
}

function requestPasswordReset() {
    const email = document.getElementById('forgotEmail')?.value.trim();

    if (!email) {
        showFormMessage('forgotStatus', 'Please enter your email address.', true);
        return;
    }

    showFormMessage('forgotStatus', 'Password reset link sent successfully to ' + email + '.', false);
}

function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

function showFormMessage(elementId, message, isError) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) {
        if (isError) {
            alert(message);
        } else {
            showNotification(message);
        }
        return;
    }

    statusElement.textContent = message;
    statusElement.className = isError ? 'login-status error' : 'login-status success';
}

function setupFormListener() {
    const form = document.getElementById('complaintForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitComplaint();
    });
}

function submitComplaint() {
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const category = document.getElementById('category')?.value;
    const complaint = document.getElementById('complaint')?.value.trim();

    if (!name || !email || !category || !complaint) {
        alert('Please fill in all fields.');
        return;
    }

    const complaintData = {
        id: Date.now(),
        name,
        email,
        category,
        complaint,
        status: 'Open',
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    const complaints = getComplaintsFromStorage();
    complaints.push(complaintData);
    localStorage.setItem('complaints', JSON.stringify(complaints));

    document.getElementById('complaintForm').reset();
    loadComplaints();
    loadDashboardData();
    loadHomeStats();
    showNotification('Complaint submitted successfully.');
}

function getComplaintsFromStorage() {
    const stored = localStorage.getItem('complaints');
    return stored ? JSON.parse(stored) : [];
}

function getSortedComplaints() {
    return getComplaintsFromStorage().sort((a, b) => b.timestamp - a.timestamp);
}

function loadComplaints() {
    const complaintsList = document.getElementById('complaintsList');
    if (!complaintsList) return;

    const complaints = getSortedComplaints();
    const countElements = ['complaintCount', 'heroComplaintCount'];

    countElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = complaints.length;
    });

    complaintsList.innerHTML = '';

    if (complaints.length === 0) {
        complaintsList.innerHTML = '<p class="no-complaints">No complaints yet. Add the first complaint from the form.</p>';
        return;
    }

    complaints.forEach(complaint => {
        complaintsList.appendChild(createComplaintCard(complaint));
    });
}

function createComplaintCard(complaint) {
    const card = document.createElement('div');
    card.className = 'complaint-card';

    const dateObj = new Date(complaint.timestamp);
    const timeAgo = getTimeAgo(dateObj);

    card.innerHTML = `
        <div class="complaint-header">
            <div>
                <div class="complaint-name">${escapeHtml(complaint.name)}</div>
            </div>
            <span class="complaint-category">${escapeHtml(complaint.category)}</span>
        </div>
        <div class="complaint-meta">
            <span>📧 <a href="mailto:${escapeHtml(complaint.email)}" class="complaint-email">${escapeHtml(complaint.email)}</a></span>
            <span>📅 ${escapeHtml(complaint.date)} (${timeAgo})</span>
        </div>
        <div class="complaint-text">${escapeHtml(complaint.complaint)}</div>
        <div class="complaint-actions">
            <span class="status-pill">${escapeHtml(complaint.status || 'Open')}</span>
            <button class="btn-delete" onclick="deleteComplaint(${complaint.id})">Delete</button>
        </div>
    `;

    return card;
}

function deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    const complaints = getComplaintsFromStorage().filter(item => item.id !== id);
    localStorage.setItem('complaints', JSON.stringify(complaints));
    loadComplaints();
    loadDashboardData();
    loadHomeStats();
    showNotification('Complaint deleted successfully.');
}

function loadHomeStats() {
    const homeCount = document.getElementById('homeComplaintCount');
    const latestCategory = document.getElementById('latestCategory');
    if (!homeCount && !latestCategory) return;

    const complaints = getSortedComplaints();
    if (homeCount) homeCount.textContent = complaints.length;
    if (latestCategory) latestCategory.textContent = complaints[0]?.category || 'No complaints yet';
}

function loadDashboardData() {
    const totalEl = document.getElementById('totalComplaints');
    const openEl = document.getElementById('openComplaints');
    const todayEl = document.getElementById('todayComplaints');
    const recentEl = document.getElementById('recentComplaintText');
    const dashboardList = document.getElementById('dashboardComplaints');

    if (!totalEl && !openEl && !todayEl && !recentEl && !dashboardList) return;

    const complaints = getSortedComplaints();
    const today = new Date().toDateString();
    const todayCount = complaints.filter(item => new Date(item.timestamp).toDateString() === today).length;

    if (totalEl) totalEl.textContent = complaints.length;
    if (openEl) openEl.textContent = complaints.filter(item => (item.status || 'Open') === 'Open').length;
    if (todayEl) todayEl.textContent = todayCount;
    if (recentEl) recentEl.textContent = complaints[0] ? complaints[0].category + ' complaint from ' + complaints[0].name : 'No recent complaint';

    if (dashboardList) {
        dashboardList.innerHTML = '';

        if (complaints.length === 0) {
            dashboardList.innerHTML = '<div class="empty-state">No complaints available for the dashboard yet.</div>';
            return;
        }

        complaints.slice(0, 5).forEach(item => {
            dashboardList.appendChild(createComplaintCard(item));
        });
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1d8f4f;
        color: white;
        padding: 14px 18px;
        border-radius: 12px;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.max(seconds, 0) + ' seconds ago';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(300px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(300px); opacity: 0; }
    }
`;
document.head.appendChild(style);
