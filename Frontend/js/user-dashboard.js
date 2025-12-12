// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'index.html';
}

const userInfo = getUserInfo();
if (userInfo.isAdmin) {
    window.location.href = 'admin-dashboard.html';
}

// State
let allUsers = [];
let currentFileToShare = null;
let userFiles = [];
let sharedFiles = [];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userEmail').textContent = userInfo.username || userInfo.email;
    loadUserStats();
    loadFiles();
    loadAllUsers();
    loadUserProfile();
});

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch(API.getUserStats, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        document.getElementById('filesCount').textContent = data.filesUploaded || 0;
        const storageMB = (data.storageUsed / (1024 * 1024)).toFixed(2);
        document.getElementById('storageUsed').textContent = `${storageMB} MB`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load files
async function loadFiles() {
    try {
        const response = await fetch(API.getFiles, {
            headers: getAuthHeaders()
        });

        userFiles = await response.json();
        renderFiles();
    } catch (error) {
        console.error('Error loading files:', error);
        document.getElementById('filesTableBody').innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: var(--accent-pink);">Error loading files</td></tr>
    `;
    }
}

// Load shared files
async function loadSharedFiles() {
    try {
        const response = await fetch(API.getSharedFiles, {
            headers: getAuthHeaders()
        });

        sharedFiles = await response.json();
        renderSharedFiles();
    } catch (error) {
        console.error('Error loading shared files:', error);
        document.getElementById('sharedFilesTableBody').innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: var(--accent-pink);">Error loading shared files</td></tr>
    `;
    }
}

// Render files
function renderFiles() {
    const tbody = document.getElementById('filesTableBody');

    if (userFiles.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No files uploaded yet</td></tr>
    `;
        return;
    }

    tbody.innerHTML = userFiles.map(file => {
        const size = (file.fileSize / 1024).toFixed(2);
        const date = new Date(file.uploadedAt).toLocaleDateString();

        return `
      <tr>
        <td>${file.fileName}</td>
        <td>${size} KB</td>
        <td>${date}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="downloadFile('${file._id}')">
              📥 Download
            </button>
            <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openShareModal('${file._id}')">
              📤 Share
            </button>
            <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="deleteFile('${file._id}')">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
}

// Render shared files
function renderSharedFiles() {
    const tbody = document.getElementById('sharedFilesTableBody');

    if (sharedFiles.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No files shared with you</td></tr>
    `;
        return;
    }

    tbody.innerHTML = sharedFiles.map(file => {
        const size = (file.fileSize / 1024).toFixed(2);

        return `
      <tr>
        <td>${file.fileName}</td>
        <td>${file.userId?.username || 'Unknown'}</td>
        <td>${size} KB</td>
        <td>
          <button class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="downloadFile('${file._id}')">
            📥 Download
          </button>
        </td>
      </tr>
    `;
    }).join('');
}

// Handle file upload
async function handleUpload(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(API.uploadFile, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Upload failed');
            return;
        }

        alert('File uploaded successfully!');
        fileInput.value = '';
        loadFiles();
        loadUserStats();
    } catch (error) {
        console.error('Upload error:', error);
        alert('An error occurred during upload');
    }
}

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        const response = await fetch(API.deleteFile(fileId), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Delete failed');
            return;
        }

        alert('File deleted successfully!');
        loadFiles();
        loadUserStats();
    } catch (error) {
        console.error('Delete error:', error);
        alert('An error occurred during deletion');
    }
}

// Download file using blob pattern
async function downloadFile(fileId) {
    console.log('Attempting to download file:', fileId);
    try {
        const url = API.downloadFile(fileId);
        console.log('Download API URL:', url);

        // Fetch file as blob from backend proxy
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            // Try to parse error message
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                alert(errorData.message || 'Download failed');
            } catch {
                alert('Download failed: ' + errorText);
            }
            return;
        }

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
                filename = decodeURIComponent(filename);
            }
        }

        console.log('Downloading file:', filename);

        // Convert response to blob
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'bytes');

        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            console.log('Download completed and cleaned up');
        }, 100);

    } catch (error) {
        console.error('Download error:', error);
        alert('An error occurred during download: ' + error.message);
    }
}

// Load all users for sharing
async function loadAllUsers() {
    try {
        const response = await fetch(API.getAllUsers, {
            headers: getAuthHeaders()
        });

        allUsers = await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Open share modal
function openShareModal(fileId) {
    currentFileToShare = fileId;
    const modal = document.getElementById('shareModal');
    const usersList = document.getElementById('usersList');

    usersList.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-md); cursor: pointer;">
        <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
        <span style="font-weight: 600;">Select All</span>
      </label>
    </div>
    ${allUsers.map(user => `
      <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-md); margin-bottom: 0.5rem; cursor: pointer;">
        <input type="checkbox" class="user-checkbox" value="${user._id}">
        <span>${user.username}</span>
      </label>
    `).join('')}
  `;

    modal.classList.add('active');
}

// Close share modal
function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
    currentFileToShare = null;
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.user-checkbox');

    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });
}

// Confirm share
async function confirmShare() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => cb.value);

    if (userIds.length === 0) {
        alert('Please select at least one user');
        return;
    }

    try {
        const response = await fetch(API.shareFile(currentFileToShare), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userIds })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Share failed');
            return;
        }

        alert('File shared successfully!');
        closeShareModal();
    } catch (error) {
        console.error('Share error:', error);
        alert('An error occurred while sharing');
    }
}

// Show tab
function showTab(tab) {
    // Reset all tab buttons to secondary (white)
    document.getElementById('filesTabBtn').classList.remove('btn-primary');
    document.getElementById('filesTabBtn').classList.add('btn-secondary');
    document.getElementById('sharedTabBtn').classList.remove('btn-primary');
    document.getElementById('sharedTabBtn').classList.add('btn-secondary');
    document.getElementById('mfaTabBtn').classList.remove('btn-primary');
    document.getElementById('mfaTabBtn').classList.add('btn-secondary');
    document.getElementById('passwordTabBtn').classList.remove('btn-primary');
    document.getElementById('passwordTabBtn').classList.add('btn-secondary');
    document.getElementById('feedbackTabBtn').classList.remove('btn-primary');
    document.getElementById('feedbackTabBtn').classList.add('btn-secondary');

    // Hide all tabs
    document.getElementById('filesTab').classList.add('hidden');
    document.getElementById('sharedTab').classList.add('hidden');
    document.getElementById('mfaTab').classList.add('hidden');
    document.getElementById('passwordTab').classList.add('hidden');
    document.getElementById('feedbackTab').classList.add('hidden');

    // Show selected tab
    if (tab === 'files') {
        document.getElementById('filesTab').classList.remove('hidden');
        document.getElementById('filesTabBtn').classList.remove('btn-secondary');
        document.getElementById('filesTabBtn').classList.add('btn-primary');
    } else if (tab === 'shared') {
        document.getElementById('sharedTab').classList.remove('hidden');
        document.getElementById('sharedTabBtn').classList.remove('btn-secondary');
        document.getElementById('sharedTabBtn').classList.add('btn-primary');
        loadSharedFiles();
    } else if (tab === 'mfa') {
        document.getElementById('mfaTab').classList.remove('hidden');
        document.getElementById('mfaTabBtn').classList.remove('btn-secondary');
        document.getElementById('mfaTabBtn').classList.add('btn-primary');
        loadMFASettings();
    } else if (tab === 'password') {
        document.getElementById('passwordTab').classList.remove('hidden');
        document.getElementById('passwordTabBtn').classList.remove('btn-secondary');
        document.getElementById('passwordTabBtn').classList.add('btn-primary');
    } else if (tab === 'feedback') {
        document.getElementById('feedbackTab').classList.remove('hidden');
        document.getElementById('feedbackTabBtn').classList.remove('btn-secondary');
        document.getElementById('feedbackTabBtn').classList.add('btn-primary');
    }
}

// Load user profile for MFA settings
async function loadUserProfile() {
    try {
        const response = await fetch(API.getUserProfile, {
            headers: getAuthHeaders()
        });

        const user = await response.json();
        // Store for later use
        window.currentUserProfile = user;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load MFA settings
function loadMFASettings() {
    if (window.currentUserProfile) {
        const currentEmail = window.currentUserProfile.otpEmail || 'Not set';
        document.getElementById('currentOtpEmail').textContent = currentEmail;
        if (window.currentUserProfile.otpEmail) {
            document.getElementById('otpEmailUpdate').value = window.currentUserProfile.otpEmail;
        }
    }
}

// Handle MFA update
async function handleMFAUpdate(event) {
    event.preventDefault();

    const otpEmail = document.getElementById('otpEmailUpdate').value;

    if (!otpEmail) {
        alert('Please enter an OTP email');
        return;
    }

    try {
        const response = await fetch(API.updateMFA, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otpEmail })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Update failed');
            return;
        }

        alert('OTP email updated successfully!');
        document.getElementById('currentOtpEmail').textContent = otpEmail;
        // Reload profile
        loadUserProfile();
    } catch (error) {
        console.error('MFA update error:', error);
        alert('An error occurred while updating MFA');
    }
}

// Reset MFA form
function resetMFAForm() {
    document.getElementById('mfaForm').reset();
    loadMFASettings(); // Reload current settings
}

// Handle feedback
async function handleFeedback(event) {
    event.preventDefault();

    const message = document.getElementById('feedbackMessage').value;

    try {
        const response = await fetch(API.submitFeedback, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Feedback submission failed');
            return;
        }

        alert('Feedback sent successfully!');
        document.getElementById('feedbackForm').reset();
    } catch (error) {
        console.error('Feedback error:', error);
        alert('An error occurred while sending feedback');
    }
}

// Handle password reset
async function handlePasswordReset(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    // Validate password length
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Password reset failed');
            return;
        }

        alert('Password reset successfully! Please login again with your new password.');

        // Clear form
        document.getElementById('passwordForm').reset();

        // Optional: Logout user and redirect to login
        setTimeout(() => {
            logout();
        }, 1500);

    } catch (error) {
        console.error('Password reset error:', error);
        alert('An error occurred while resetting password');
    }
}

// Reset password form
function resetPasswordForm() {
    document.getElementById('passwordForm').reset();
}
