// API Configuration
// Auto-detect environment: use Vercel URL in production, localhost in development
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/api'
    : `${window.location.origin}/api`;

// API Endpoints
const API = {
    // Auth
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    verifyMFA: `${API_BASE_URL}/auth/verify-mfa`,

    // User
    profile: `${API_BASE_URL}/user/profile`,
    getUserProfile: `${API_BASE_URL}/user/profile`,
    updateMFA: `${API_BASE_URL}/user/mfa`,
    resetPassword: `${API_BASE_URL}/user/reset-password`,
    uploadFile: `${API_BASE_URL}/user/upload`,
    getFiles: `${API_BASE_URL}/user/files`,
    getSharedFiles: `${API_BASE_URL}/user/shared-files`,
    deleteFile: (fileId) => `${API_BASE_URL}/user/files/${fileId}`,
    shareFile: (fileId) => `${API_BASE_URL}/user/files/${fileId}/share`,
    downloadFile: (fileId) => `${API_BASE_URL}/user/files/${fileId}/download`,
    getAllUsers: `${API_BASE_URL}/user/all-users`,
    submitFeedback: `${API_BASE_URL}/user/feedback`,
    getUserStats: `${API_BASE_URL}/user/stats`,

    // Admin
    getAccessLogs: `${API_BASE_URL}/admin/access-logs`,
    getUsers: `${API_BASE_URL}/admin/users`,
    blockUser: (userId) => `${API_BASE_URL}/admin/users/${userId}/block`,
    deleteUser: (userId) => `${API_BASE_URL}/admin/users/${userId}`,
    getFeedback: `${API_BASE_URL}/admin/feedback`,
    markFeedbackRead: (feedbackId) => `${API_BASE_URL}/admin/feedback/${feedbackId}/read`,
    getAdminStats: `${API_BASE_URL}/admin/stats`,
    getUnusualTimeSettings: `${API_BASE_URL}/admin/settings/unusual-time`,
    updateUnusualTimeSettings: `${API_BASE_URL}/admin/settings/unusual-time`
};

// Helper function to get auth token
function getToken() {
    return localStorage.getItem('authToken');
}

// Helper function to get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// Helper function to check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Helper function to get user info
function getUserInfo() {
    const userStr = localStorage.getItem('userInfo');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper function to logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'index.html';
}
