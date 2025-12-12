# Project Update Summary - Risk-Based Authentication System

## Overview
This document summarizes all the major changes made to implement username-based authentication, simplified OTP-only MFA, risk-based access control with email notifications, and forgot password functionality.

---

## Backend Changes

### 1. User Model (`Backend/models/User.js`)
**Changes:**
- Replaced `email` field with `username` (unique identifier)
- Removed `mfaMethod` and `mfaData` fields (fingerprint removed)
- Added `otpEmail` field for OTP-based MFA
- Added `blockedUntil` timestamp for 4-hour blocking system
- Added `address` field in `registeredLocation` for storing full address

### 2. Email Service (`Backend/utils/emailService.js`)
**New Functions Added:**
- `sendHighRiskWarning()` - Sends email when risk score is 41-70
- `sendBlockedNotification()` - Sends email when user is blocked (risk > 70)
- `sendForgotPassword()` - Sends temporary password to registered OTP email

### 3. Authentication Routes (`Backend/routes/auth.js`)
**Major Changes:**
- Changed from email-based to username-based authentication
- Implemented risk-based access control:
  - **0-40 (Low Risk)**: Direct access granted
  - **41-70 (Medium Risk)**: OTP sent to registered email + high risk warning email
  - **>70 (High Risk)**: Account blocked for 4 hours + blocked notification email
- Added auto-unblock after 4 hours
- Added `/forgot-password` endpoint that sends temporary password to OTP email
- Removed all fingerprint/biometric authentication code

### 4. User Routes (`Backend/routes/user.js`)
**Changes:**
- Simplified `/mfa` endpoint to only handle `otpEmail` updates
- Updated all user queries to use `username` instead of `email`
- Removed fingerprint-related MFA logic

### 5. Admin Routes (`Backend/routes/admin.js`)
**Changes:**
- Updated unblock functionality to clear `blockedUntil` timestamp
- Changed all population queries from `email` to `username`

---

## Frontend Changes

### 1. New Page: Access Control (`Frontend/access-control.html`)
**Purpose:** Intermediate page between login and dashboard
**Features:**
- **Low Risk (0-40)**: Shows green checkmark, risk score, "Access Allowed" message, and "Enter Dashboard" button
- **Medium Risk (41-70)**: Shows warning icon, risk score, "MFA Required" message, 4-digit OTP input fields, auto-verification
- **High Risk (>70)**: Shows blocked icon, risk score, blocking message with duration, "Back" button

### 2. Login/Signup Page (`Frontend/index.html`)
**Changes:**
- Changed from email to username fields
- Removed all fingerprint/biometric UI components
- Added OTP email field (optional) in signup
- Added "Forgot Password" link and modal
- Enhanced location display to show:
  - Latitude
  - Longitude
  - Full address (using reverse geocoding)

### 3. User Dashboard (`Frontend/user-dashboard.html`)
**Changes:**
- Simplified MFA Settings tab:
  - Removed fingerprint options
  - Only shows OTP email input field
  - Shows current registered OTP email
  - "Update MFA" and "Reset" buttons
- Removed webauthn.js script reference

### 4. Authentication JavaScript (`Frontend/js/auth.js`)
**Complete Rewrite:**
- Removed all fingerprint/biometric code
- Changed to username-based authentication
- Added reverse geocoding to get address from coordinates
- Displays lat/long/address in location status
- Redirects to `access-control.html` instead of direct dashboard access
- Added forgot password functionality
- Removed MFA modal (now handled in access-control page)

### 5. User Dashboard JavaScript (`Frontend/js/user-dashboard.js`)
**Changes:**
- Display username instead of email
- Simplified MFA update to only handle OTP email
- Added `loadUserProfile()` to fetch current user data
- Added `loadMFASettings()` to display current OTP email
- Updated all user references from email to username
- Removed all fingerprint/biometric functions

---

## New Features Summary

### 1. Username-Based Authentication
- Users now register and login with username instead of email
- Email is only used for OTP (optional during signup)

### 2. Risk-Based Access Control
| Risk Score | Action | Email Notification |
|------------|--------|-------------------|
| 0-40 | Access Allowed (Low Risk) | None |
| 41-70 | MFA Required (Medium Risk) | High Risk Warning |
| >70 | Blocked for 4 hours (High Risk) | Blocked Notification |

### 3. Intermediate Access Page
- Shows different prompts based on risk score
- Handles OTP verification with visual feedback
- Provides clear messaging about access status

### 4. Enhanced Location Display
- Shows exact latitude and longitude
- Displays full address using reverse geocoding
- Stored in database for future reference

### 5. Forgot Password
- Users can request password via username
- Temporary password sent to registered OTP email
- Works only if OTP email is registered

### 6. 4-Hour Blocking System
- Automatic blocking when risk score > 70
- Auto-unblock after 4 hours
- Admin can manually unblock anytime
- Email notification sent on blocking

### 7. Simplified MFA
- Removed fingerprint/biometric completely
- Only OTP-based MFA via email
- Can register/update OTP email anytime
- Shows current registered email

---

## Email Notifications

### 1. OTP Email (Risk 41-70)
- Subject: "Your MFA Verification Code"
- Contains 4-digit OTP
- Expires in 5 minutes

### 2. High Risk Warning (Risk 41-70)
- Subject: "⚠️ High Risk Score Detected - DEVVAULT"
- Alerts user about high risk login attempt
- Sent when MFA is required

### 3. Blocked Notification (Risk >70)
- Subject: "🚫 Account Blocked - DEVVAULT"
- Informs about 4-hour block
- Provides instructions to contact admin

### 4. Forgot Password
- Subject: "🔑 Your Password - DEVVAULT"
- Contains temporary password
- Recommends changing password after login

---

## Testing the New Features

### Test Scenario 1: Low Risk Login (0-40)
1. Login with correct credentials from registered location
2. Should see intermediate page with "Low Risk: Access Allowed"
3. Click "Enter Dashboard" to access user dashboard

### Test Scenario 2: Medium Risk Login (41-70)
1. Login from different location or with unusual behavior
2. Should see intermediate page with "Medium Risk: MFA Required"
3. Check OTP email for 4-digit code
4. Enter OTP in 4 input fields
5. Should see "✓ Correct OTP" and redirect to dashboard
6. Check email for "High Risk Warning" notification

### Test Scenario 3: High Risk Login (>70)
1. Login with very high risk score
2. Should see intermediate page with "High Risk: Account Blocked"
3. Check email for "Blocked Notification"
4. Wait 4 hours OR ask admin to unblock
5. Try login again after unblock

### Test Scenario 4: Forgot Password
1. Click "Forgot Password" on login page
2. Enter username
3. Check registered OTP email for temporary password
4. Login with temporary password

### Test Scenario 5: Update MFA Settings
1. Login to user dashboard
2. Go to "MFA Settings" tab
3. Enter/update OTP email
4. Click "Update MFA"
5. Current email should be displayed

---

## Important Notes

1. **Password Security**: The forgot password feature sends plain text passwords (temporary). In production, use password reset links instead.

2. **OTP Storage**: OTPs are currently stored in memory (Map). For production, use Redis or similar.

3. **Admin Credentials**: Admin login uses username "admin" with password from environment variable.

4. **Reverse Geocoding**: Uses OpenStreetMap's Nominatim API (free, no API key needed).

5. **Email Configuration**: Ensure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD are set in .env file.

---

## Files Modified

### Backend
- `models/User.js`
- `utils/emailService.js`
- `routes/auth.js`
- `routes/user.js`
- `routes/admin.js`

### Frontend
- `index.html`
- `user-dashboard.html`
- `access-control.html` (NEW)
- `js/auth.js`
- `js/user-dashboard.js`

---

## Next Steps

1. Test all scenarios thoroughly
2. Update existing users in database (migration script may be needed)
3. Consider implementing password reset links instead of sending passwords
4. Add rate limiting for OTP requests
5. Implement Redis for OTP storage in production
6. Add email verification during signup
7. Enhance admin dashboard to show blocked users with unblock button

---

**Last Updated:** December 9, 2025
**Version:** 2.0.0
