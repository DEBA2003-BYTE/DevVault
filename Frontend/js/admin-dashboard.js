// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'index.html';
}

const userInfo = getUserInfo();
if (!userInfo.isAdmin) {
    window.location.href = 'user-dashboard.html';
}

// State
let accessLogs = [];
let users = [];
let feedback = [];
let unusualTimeRanges = [];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadAdminStats();
    loadAccessLogs();
    loadUnusualTimeSettings();
});

// Load admin statistics
async function loadAdminStats() {
    try {
        const response = await fetch(API.getAdminStats, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalFeedback').textContent = data.totalFeedback || 0;
        document.getElementById('totalLogs').textContent = data.totalAccessLogs || 0;
        document.getElementById('blockedUsers').textContent = data.blockedUsers || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load access logs
async function loadAccessLogs() {
    try {
        const response = await fetch(API.getAccessLogs, {
            headers: getAuthHeaders()
        });

        accessLogs = await response.json();
        renderAccessLogs();
    } catch (error) {
        console.error('Error loading access logs:', error);
        document.getElementById('logsTableBody').innerHTML = `
      <tr><td colspan="9" style="text-align: center; color: var(--accent-pink);">Error loading logs</td></tr>
    `;
    }
}

// Render access logs
function renderAccessLogs() {
    const tbody = document.getElementById('logsTableBody');

    if (accessLogs.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No access logs yet</td></tr>
    `;
        return;
    }

    tbody.innerHTML = accessLogs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const actionBadge = log.action === 'access_granted' ? 'badge-success' :
            log.action === 'mfa_required' ? 'badge-warning' : 'badge-danger';
        const actionText = log.action === 'access_granted' ? 'Access Granted' :
            log.action === 'mfa_required' ? 'MFA Required' : 'Blocked';
        const statusBadge = log.loginSuccess ? 'badge-success' : 'badge-danger';
        const statusText = log.loginSuccess ? 'Success' : 'Failed';

        return `
      <tr>
        <td>${log.username || 'Unknown'}</td>
        <td style="font-size: 0.85rem;">${timestamp}</td>
        <td>${log.riskFactors.locationAnomaly.score}/${log.riskFactors.locationAnomaly.maxScore}</td>
        <td>${log.riskFactors.keystrokeAnomaly.score}/${log.riskFactors.keystrokeAnomaly.maxScore} (${log.riskFactors.keystrokeAnomaly.deleteCount} dels)</td>
        <td>${log.riskFactors.sessionTime.score}/${log.riskFactors.sessionTime.maxScore} (${log.riskFactors.sessionTime.duration}s)</td>
        <td>${log.riskFactors.unusualTime.score}/${log.riskFactors.unusualTime.maxScore}</td>
        <td><strong>${log.totalRiskScore}/100</strong></td>
        <td><span class="badge ${actionBadge}">${actionText}</span></td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
      </tr>
    `;
    }).join('');
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(API.getUsers, {
            headers: getAuthHeaders()
        });

        users = await response.json();
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
      <tr><td colspan="6" style="text-align: center; color: var(--accent-pink);">Error loading users</td></tr>
    `;
    }
}

// Render users
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No users registered yet</td></tr>
    `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const registered = new Date(user.createdAt).toLocaleDateString();
        const storageMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
        const statusBadge = user.isBlocked ? 'badge-danger' : 'badge-success';
        const statusText = user.isBlocked ? 'Blocked' : 'Active';
        const blockBtnText = user.isBlocked ? 'Unblock' : 'Block';
        const blockBtnClass = user.isBlocked ? 'btn-success' : 'btn-danger';

        return `
      <tr>
        <td>${user.username}</td>
        <td>${registered}</td>
        <td>${user.filesUploaded}</td>
        <td>${storageMB} MB</td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn ${blockBtnClass}" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="toggleBlockUser('${user._id}', ${!user.isBlocked})">
              ${blockBtnText}
            </button>
            <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="deleteUser('${user._id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
}

// Toggle block user
async function toggleBlockUser(userId, shouldBlock) {
    const action = shouldBlock ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }

    try {
        const response = await fetch(API.blockUser(userId), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isBlocked: shouldBlock })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || `Failed to ${action} user`);
            return;
        }

        alert(`User ${action}ed successfully!`);
        loadUsers();
        loadAdminStats();
    } catch (error) {
        console.error('Error toggling user block:', error);
        alert('An error occurred');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(API.deleteUser(userId), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to delete user');
            return;
        }

        alert('User deleted successfully!');
        loadUsers();
        loadAdminStats();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred');
    }
}

// Load feedback
async function loadFeedback() {
    try {
        const response = await fetch(API.getFeedback, {
            headers: getAuthHeaders()
        });

        feedback = await response.json();
        renderFeedback();
    } catch (error) {
        console.error('Error loading feedback:', error);
        document.getElementById('feedbackList').innerHTML = `
      <p style="text-align: center; color: var(--accent-pink);">Error loading feedback</p>
    `;
    }
}

// Render feedback
function renderFeedback() {
    const container = document.getElementById('feedbackList');

    if (feedback.length === 0) {
        container.innerHTML = `
      <p style="text-align: center; color: var(--text-muted);">No feedback received yet</p>
    `;
        return;
    }

    container.innerHTML = feedback.map(item => {
        const date = new Date(item.createdAt).toLocaleString();
        const readBadge = item.isRead ? 'badge-success' : 'badge-warning';
        const readText = item.isRead ? 'Read' : 'Unread';

        return `
      <div class="card" style="margin-bottom: 1rem; ${!item.isRead ? 'border-left: 4px solid var(--accent-pink);' : ''}">
        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div style="flex: 1;">
            <strong>${item.username || 'Unknown'}</strong>
            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 1rem;">${date}</span>
          </div>
          <span class="badge ${readBadge}">${readText}</span>
        </div>
        <p style="color: var(--text-secondary); margin: 0.5rem 0;">${item.message}</p>
        ${!item.isRead ? `
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-top: 0.5rem;" onclick="markFeedbackRead('${item._id}')">
            Mark as Read
          </button>
        ` : ''}
      </div>
    `;
    }).join('');
}

// Mark feedback as read
async function markFeedbackRead(feedbackId) {
    try {
        const response = await fetch(API.markFeedbackRead(feedbackId), {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to mark as read');
            return;
        }

        loadFeedback();
    } catch (error) {
        console.error('Error marking feedback as read:', error);
        alert('An error occurred');
    }
}

// Load unusual time settings
async function loadUnusualTimeSettings() {
    try {
        const response = await fetch(API.getUnusualTimeSettings, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        unusualTimeRanges = data.unusualTimeRanges || [];
        renderTimeRanges();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Render time ranges
function renderTimeRanges() {
    const container = document.getElementById('timeRangesList');

    if (unusualTimeRanges.length === 0) {
        container.innerHTML = `
      <p style="color: var(--text-muted);">No unusual time ranges configured</p>
    `;
        return;
    }

    container.innerHTML = unusualTimeRanges.map((range, index) => {
        const startMinutes = timeToMinutes(range.startTime);
        const endMinutes = timeToMinutes(range.endTime);
        const crossesMidnight = startMinutes > endMinutes;

        return `
    <div class="card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${range.startTime} - ${range.endTime}</strong>
        <p style="color: var(--text-secondary); margin: 0; font-size: 0.85rem;">
          ${crossesMidnight ? 'Crosses midnight' : 'Same day'}
        </p>
      </div>
      <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="removeTimeRange(${index})">
        Remove
      </button>
    </div>
  `;
    }).join('');
}

// Helper function to convert HH:MM to minutes
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Add time range
function addTimeRange() {
    document.getElementById('timeRangeModal').classList.add('active');
}

// Close time range modal
function closeTimeRangeModal() {
    document.getElementById('timeRangeModal').classList.remove('active');
    document.getElementById('timeRangeForm').reset();
}

// Save time range
async function saveTimeRange(event) {
    event.preventDefault();

    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    unusualTimeRanges.push({ startTime, endTime });

    try {
        const response = await fetch(API.updateUnusualTimeSettings, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ unusualTimeRanges })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to save settings');
            unusualTimeRanges.pop(); // Remove the added range
            return;
        }

        alert('Time range added successfully!');
        closeTimeRangeModal();
        renderTimeRanges();
    } catch (error) {
        console.error('Error saving time range:', error);
        alert('An error occurred');
        unusualTimeRanges.pop();
    }
}

// Remove time range
async function removeTimeRange(index) {
    if (!confirm('Are you sure you want to remove this time range?')) {
        return;
    }

    unusualTimeRanges.splice(index, 1);

    try {
        const response = await fetch(API.updateUnusualTimeSettings, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ unusualTimeRanges })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to update settings');
            return;
        }

        alert('Time range removed successfully!');
        renderTimeRanges();
    } catch (error) {
        console.error('Error removing time range:', error);
        alert('An error occurred');
    }
}

// Show tab
function showTab(tab) {
    // Reset all tab buttons to secondary (white)
    document.getElementById('logsTabBtn').classList.remove('btn-primary');
    document.getElementById('logsTabBtn').classList.add('btn-secondary');
    document.getElementById('usersTabBtn').classList.remove('btn-primary');
    document.getElementById('usersTabBtn').classList.add('btn-secondary');
    document.getElementById('feedbackTabBtn').classList.remove('btn-primary');
    document.getElementById('feedbackTabBtn').classList.add('btn-secondary');
    document.getElementById('settingsTabBtn').classList.remove('btn-primary');
    document.getElementById('settingsTabBtn').classList.add('btn-secondary');

    // Hide all tabs
    document.getElementById('logsTab').classList.add('hidden');
    document.getElementById('usersTab').classList.add('hidden');
    document.getElementById('feedbackTab').classList.add('hidden');
    document.getElementById('settingsTab').classList.add('hidden');

    // Show selected tab and load data
    if (tab === 'logs') {
        document.getElementById('logsTab').classList.remove('hidden');
        document.getElementById('logsTabBtn').classList.remove('btn-secondary');
        document.getElementById('logsTabBtn').classList.add('btn-primary');
        loadAccessLogs();
    } else if (tab === 'users') {
        document.getElementById('usersTab').classList.remove('hidden');
        document.getElementById('usersTabBtn').classList.remove('btn-secondary');
        document.getElementById('usersTabBtn').classList.add('btn-primary');
        loadUsers();
    } else if (tab === 'feedback') {
        document.getElementById('feedbackTab').classList.remove('hidden');
        document.getElementById('feedbackTabBtn').classList.remove('btn-secondary');
        document.getElementById('feedbackTabBtn').classList.add('btn-primary');
        loadFeedback();
    } else if (tab === 'settings') {
        document.getElementById('settingsTab').classList.remove('hidden');
        document.getElementById('settingsTabBtn').classList.remove('btn-secondary');
        document.getElementById('settingsTabBtn').classList.add('btn-primary');
    }
}
