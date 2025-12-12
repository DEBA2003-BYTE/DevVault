// State management
let locationGranted = false;
let signupLocationGranted = false;
let currentLocation = null;
let signupCurrentLocation = null;
let deleteCount = 0;
let sessionStartTime = null;
let sessionInterval = null;
let map = null;
let signupMap = null;
let marker = null;
let signupMarker = null;

// Initialize maps
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // India center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function initSignupMap() {
    signupMap = L.map('signupMap').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(signupMap);
}

// Get address from coordinates using reverse geocoding
async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        return data.display_name || `${lat}, ${lng}`;
    } catch (error) {
        console.error('Error fetching address:', error);
        return `${lat}, ${lng}`;
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    initSignupMap();

    // Add delete tracking to login inputs
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');

    if (loginUsername) loginUsername.addEventListener('keydown', trackDelete);
    if (loginPassword) loginPassword.addEventListener('keydown', trackDelete);
});

// Track delete/backspace
function trackDelete(event) {
    if (event.key === 'Backspace' || event.key === 'Delete') {
        if (event.target.value.length > 0) {
            deleteCount++;
            document.getElementById('deleteCount').textContent = deleteCount;
        }
    }
}

// Update current time display
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (!timeElement) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const timeString = `${hours}:${minutes}:${seconds}`;
    timeElement.textContent = timeString;
}

// Start time display
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
    });
} else {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

// Toggle location for login
async function toggleLocation() {
    if (!locationGranted) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    locationGranted = true;
                    currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // Get address
                    const address = await getAddressFromCoords(currentLocation.latitude, currentLocation.longitude);
                    currentLocation.address = address;

                    // Update UI
                    document.getElementById('locationStatus').textContent = 'Granted ✓';
                    document.getElementById('locationStatus').style.color = 'var(--accent-green)';
                    document.getElementById('locationBtn').textContent = 'Disallow Location Access';
                    document.getElementById('locationBtn').classList.remove('btn-primary');
                    document.getElementById('locationBtn').classList.add('btn-danger');

                    // Show location details
                    document.getElementById('loginLat').textContent = currentLocation.latitude.toFixed(6);
                    document.getElementById('loginLng').textContent = currentLocation.longitude.toFixed(6);
                    document.getElementById('loginAddress').textContent = address;
                    document.getElementById('locationDetails').classList.remove('hidden');

                    // Enable form inputs
                    document.getElementById('loginUsername').disabled = false;
                    document.getElementById('loginPassword').disabled = false;
                    document.getElementById('loginSubmitBtn').disabled = false;

                    // Start session timer
                    startSessionTimer();

                    // Update map
                    map.setView([currentLocation.latitude, currentLocation.longitude], 13);
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker([currentLocation.latitude, currentLocation.longitude]).addTo(map);
                    marker.bindPopup('Your Location').openPopup();
                },
                (error) => {
                    alert('Unable to get location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    } else {
        // Disallow location
        locationGranted = false;
        currentLocation = null;

        // Update UI
        document.getElementById('locationStatus').textContent = 'Not Granted';
        document.getElementById('locationStatus').style.color = 'var(--text-primary)';
        document.getElementById('locationBtn').textContent = 'Allow Location Access';
        document.getElementById('locationBtn').classList.remove('btn-danger');
        document.getElementById('locationBtn').classList.add('btn-primary');
        document.getElementById('locationDetails').classList.add('hidden');

        // Disable form inputs
        document.getElementById('loginUsername').disabled = true;
        document.getElementById('loginPassword').disabled = true;
        document.getElementById('loginSubmitBtn').disabled = true;

        // Stop session timer and reset
        stopSessionTimer();
        resetSessionTimer();
        resetDeleteCounter();

        // Reset map
        if (marker) {
            map.removeLayer(marker);
        }
        map.setView([20.5937, 78.9629], 5);
    }
}

// Toggle location for signup
async function toggleSignupLocation() {
    if (!signupLocationGranted) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    signupLocationGranted = true;
                    signupCurrentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // Get address
                    const address = await getAddressFromCoords(signupCurrentLocation.latitude, signupCurrentLocation.longitude);
                    signupCurrentLocation.address = address;

                    // Update UI
                    document.getElementById('signupLocationStatus').textContent = 'Granted ✓';
                    document.getElementById('signupLocationStatus').style.color = 'var(--accent-green)';
                    document.getElementById('signupLocationBtn').textContent = 'Disallow Location Access';
                    document.getElementById('signupLocationBtn').classList.remove('btn-primary');
                    document.getElementById('signupLocationBtn').classList.add('btn-danger');

                    // Show location details
                    document.getElementById('signupLat').textContent = signupCurrentLocation.latitude.toFixed(6);
                    document.getElementById('signupLng').textContent = signupCurrentLocation.longitude.toFixed(6);
                    document.getElementById('signupAddress').textContent = address;
                    document.getElementById('signupLocationDetails').classList.remove('hidden');

                    // Enable form inputs
                    document.getElementById('signupUsername').disabled = false;
                    document.getElementById('signupPassword').disabled = false;
                    document.getElementById('otpEmail').disabled = false;
                    document.getElementById('signupSubmitBtn').disabled = false;

                    // Update map
                    signupMap.setView([signupCurrentLocation.latitude, signupCurrentLocation.longitude], 13);
                    if (signupMarker) {
                        signupMap.removeLayer(signupMarker);
                    }
                    signupMarker = L.marker([signupCurrentLocation.latitude, signupCurrentLocation.longitude]).addTo(signupMap);
                    signupMarker.bindPopup('Your Location').openPopup();
                },
                (error) => {
                    alert('Unable to get location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    } else {
        signupLocationGranted = false;
        signupCurrentLocation = null;

        document.getElementById('signupLocationStatus').textContent = 'Not Granted';
        document.getElementById('signupLocationStatus').style.color = 'var(--text-primary)';
        document.getElementById('signupLocationBtn').textContent = 'Allow Location Access';
        document.getElementById('signupLocationBtn').classList.remove('btn-danger');
        document.getElementById('signupLocationBtn').classList.add('btn-primary');
        document.getElementById('signupLocationDetails').classList.add('hidden');

        document.getElementById('signupUsername').disabled = true;
        document.getElementById('signupPassword').disabled = true;
        document.getElementById('otpEmail').disabled = true;
        document.getElementById('signupSubmitBtn').disabled = true;

        if (signupMarker) {
            signupMap.removeLayer(signupMarker);
        }
        signupMap.setView([20.5937, 78.9629], 5);
    }
}

// Session timer functions
function startSessionTimer() {
    sessionStartTime = Date.now();
    sessionInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        document.getElementById('sessionTime').textContent = elapsed;
    }, 1000);
}

function stopSessionTimer() {
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
    }
}

function resetSessionTimer() {
    sessionStartTime = null;
    document.getElementById('sessionTime').textContent = '0';
}

function resetDeleteCounter() {
    deleteCount = 0;
    document.getElementById('deleteCount').textContent = '0';
}

function getSessionTime() {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000);
}

// Switch tabs
function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const tabButtons = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        tabButtons[0].classList.add('active');
        tabButtons[1].classList.remove('active');
    } else {
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        tabButtons[0].classList.remove('active');
        tabButtons[1].classList.add('active');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();

    if (!locationGranted || !currentLocation) {
        alert('Please allow location access first');
        return;
    }

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const sessionTime = getSessionTime();

    try {
        const response = await fetch(API.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                location: currentLocation,
                deleteCount,
                sessionTime
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Login failed');
            return;
        }

        // Check if admin - redirect directly to admin dashboard
        if (data.user && data.user.isAdmin) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            window.location.href = 'admin-dashboard.html';
            return;
        }

        // For regular users - store data in sessionStorage for intermediate page
        sessionStorage.setItem('accessData', JSON.stringify(data));

        // Redirect to access control page
        window.location.href = 'access-control.html';

    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();

    if (!signupLocationGranted || !signupCurrentLocation) {
        alert('Please allow location access first');
        return;
    }

    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const otpEmail = document.getElementById('otpEmail').value || null;

    try {
        const response = await fetch(API.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                location: signupCurrentLocation,
                otpEmail
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Registration failed');
            return;
        }

        alert('Registration successful! Please login.');
        switchTab('login');

        // Reset form
        document.getElementById('signupForm').reset();
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during registration');
    }
}

// Forgot Password
function showForgotPassword(event) {
    event.preventDefault();
    document.getElementById('forgotPasswordModal').classList.add('active');
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
    document.getElementById('forgotPasswordForm').reset();
}

async function handleForgotPassword(event) {
    event.preventDefault();

    const username = document.getElementById('forgotUsername').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to send password');
            return;
        }

        alert('A temporary password has been sent to your registered OTP email. Please check your inbox.');
        closeForgotPasswordModal();

    } catch (error) {
        console.error('Forgot password error:', error);
        alert('An error occurred while processing your request');
    }
}
