# 🔐 DevVault – Risk-Based Authentication System

## 📌 Description

**DevVault** is a next-generation authentication platform that goes beyond traditional username-password security. It uses **behavioral analytics** and **multi-factor risk assessment** to make intelligent, real-time security decisions. Instead of a binary "correct password = access" approach, DevVault continuously evaluates user behavior to detect anomalies and adapt security measures dynamically.

**The Problem:**
- 🚨 Stolen credentials bypass traditional authentication
- 🤖 Brute force attacks overwhelm static security
- 🎭 Account takeover attacks exploit weak passwords
- 🕵️ Insider threats go undetected
- 📊 No visibility into user behavior patterns

**The Solution:**
DevVault implements **Zero Trust Architecture** with adaptive security that:
- ✅ Analyzes 4 behavioral factors in real-time
- ✅ Provides seamless access for legitimate users
- ✅ Automatically escalates security when anomalies detected
- ✅ Blocks high-risk attempts and notifies users
- ✅ Maintains comprehensive audit trails for compliance

---

## ✨ Core Features

### 🛡️ Risk-Based Authentication
- **Dynamic Risk Scoring (0-100)** – Real-time behavioral analysis
- **Three-Tier Access Control:**
  - 🟢 **Low Risk (0-40)** → Immediate access
  - 🟡 **Medium Risk (41-70)** → MFA required (OTP via email)
  - 🔴 **High Risk (71-100)** → Account blocked for 4 hours
- **Adaptive Security** – Only adds friction when necessary

### 📊 Behavioral Analytics (4 Risk Factors)
1. **📍 Location Anomaly (0-20 pts)** – Compares current location to registered location using Haversine formula
2. **⌨️ Keystroke Dynamics (0-30 pts)** – Tracks delete/backspace usage (detects hesitation)
3. **⏱️ Session Time (0-30 pts)** – Measures time on login page (identifies bots)
4. **🕐 Unusual Time (0-20 pts)** – Detects logins outside typical hours (admin-configurable)

### 🔒 Brute Force Protection
- **Auto-Lock** – 3 failed attempts within 1 hour → 4-hour block
- **Email Alerts** – User notified of suspicious activity
- **Auto-Unlock** – Automatic unblock after timeout
- **Admin Override** – Manual unblock capability

### 📧 Email Notifications
Automatic alerts for:
- 🚨 High-risk login attempts
- 🚫 Account blocks (risk-based or brute force)
- 🔑 Password recovery
- 💡 Security recommendations

### 📁 Secure File Management
- **AWS S3 Integration** – Scalable cloud storage
- **File Sharing** – Share files with other users
- **Access Control** – Owner and shared user permissions
- **Storage Tracking** – Monitor usage per user
- **Secure Download** – Backend proxy pattern

### 👨‍💼 Admin Dashboard
- **User Management** – View, block, unblock, delete users
- **Access Logs** – Complete audit trail with risk breakdown
- **Analytics** – System statistics and behavior patterns
- **Time Configuration** – Set usual login time ranges
- **Feedback Management** – Review user feedback

### 🌍 Geolocation Features
- **Interactive Maps** – Leaflet.js integration with OpenStreetMap
- **Reverse Geocoding** – Convert coordinates to addresses
- **Location Tracking** – Monitor login locations
- **Visual Indicators** – Map markers for user locations

---

## 🛠️ Tech Stack

### 🌐 Frontend (User & Admin UI)
- **HTML5, CSS3, Vanilla JavaScript** – Lightweight, fast, no framework overhead
- **Leaflet.js** – Interactive maps with OpenStreetMap
- **Nominatim API** – Reverse geocoding (coordinates → addresses)
- **Custom CSS Variables** – Modern, responsive design
- **WebAuthn API** – Ready for biometric authentication (Touch ID, Face ID)

### ⚙️ Backend (API & Business Logic)
- **Node.js + Express.js** – REST API for authentication and file management
- **MongoDB Atlas** – Cloud NoSQL database for users, logs, files, settings
- **JWT (jsonwebtoken)** – Stateless authentication with 24-hour expiration
- **bcrypt** – Password hashing with 10 salt rounds
- **Multer + Multer-S3** – File upload middleware
- **Nodemailer** – Email notifications (OTP, alerts, password recovery)

### ☁️ Cloud & Storage
- **AWS S3** – Secure file storage with access control
- **MongoDB Atlas** – Managed database with automatic scaling
- **Vercel-Ready** – Serverless deployment configuration

### 🔐 Security & Authentication
- **JWT Tokens** – Secure, stateless session management
- **bcrypt Hashing** – Industry-standard password encryption
- **CORS** – Cross-origin resource sharing control
- **dotenv** – Environment variable management
- **Risk Engine** – Custom behavioral analytics algorithm

### 📡 Integrations
- **OpenStreetMap** – Free, open-source mapping
- **Gmail SMTP** – Email delivery via Nodemailer
- **AWS SDK** – S3 file operations
- **Geolocation API** – Browser-based location tracking

---

## 🚀 Getting Started

### Prerequisites
- ✅ **Node.js** (v14+) – [Download](https://nodejs.org/)
- ✅ **MongoDB Atlas Account** – [Sign Up](https://www.mongodb.com/cloud/atlas)
- ✅ **AWS Account** (for S3) – [Sign Up](https://aws.amazon.com/)
- ✅ **Gmail Account** (for email) – [Create](https://mail.google.com/)

### Quick Start (3 Steps)

#### Step 1: Clone & Setup
```bash
git clone https://github.com/yourusername/devvault.git
cd devvault
chmod +x setup.sh
./setup.sh
```
The setup script will prompt for credentials and create `.env` automatically.

#### Step 2: Start Backend
```bash
cd Backend
npm start
```
Backend runs on `http://localhost:5001`

#### Step 3: Start Frontend
```bash
cd Frontend
npm start
```
Frontend runs on `http://localhost:3000`

### Default Admin Login
```
Email: admin@gmail.com
Password: qwerty123
```
⚠️ **Change password after first login!**

---

### Quick Setup Guides

**Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use in `EMAIL_PASSWORD`

**AWS S3:**
1. Create S3 bucket in AWS Console
2. Create IAM user with S3 access
3. Generate access keys
4. Add to `.env`

**MongoDB Atlas:**
1. Create cluster
2. Create database user
3. Whitelist IP (0.0.0.0/0 for dev)
4. Get connection string
5. Add to `.env`

---

## 📚 API Endpoints

### Authentication APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user with location |
| POST | `/api/auth/login` | Login with risk assessment |
| POST | `/api/auth/verify-mfa` | Verify OTP for MFA |
| POST | `/api/auth/forgot-password` | Request password recovery |

### User APIs (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/mfa` | Update OTP email |
| PUT | `/api/user/reset-password` | Change password |
| POST | `/api/user/upload` | Upload file to S3 |
| GET | `/api/user/files` | Get user's files |
| GET | `/api/user/files/:id/download` | Download file |
| DELETE | `/api/user/files/:id` | Delete file |
| POST | `/api/user/files/:id/share` | Share file with users |
| GET | `/api/user/shared-files` | Get files shared with user |
| POST | `/api/user/feedback` | Submit feedback |

### Admin APIs (Requires Admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/access-logs` | Get all access logs |
| GET | `/api/admin/users` | Get all users |
| PUT | `/api/admin/users/:id/block` | Block/unblock user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/feedback` | Get all feedback |
| PUT | `/api/admin/feedback/:id/read` | Mark feedback as read |
| GET | `/api/admin/stats` | Get system statistics |
| GET | `/api/admin/settings/unusual-time` | Get time settings |
| PUT | `/api/admin/settings/unusual-time` | Update time settings |

**Total: 25 API Endpoints**

---

## 🔒 Security & Compliance

### Security Features
- ✅ **bcrypt Hashing** – 10 salt rounds, timing-safe comparison
- ✅ **JWT Tokens** – 24-hour expiration, stateless authentication
- ✅ **Brute Force Protection** – 3 attempts → 4-hour lock
- ✅ **HTTPS** – Encrypted data transmission (production)
- ✅ **CORS** – Controlled cross-origin access
- ✅ **Input Validation** – Server-side validation
- ✅ **XSS Protection** – Input sanitization

### Compliance Standards
- ✅ **OWASP** – Authentication best practices
- ✅ **NIST** – Digital identity guidelines
- ✅ **PCI DSS** – Requirement 8.1.6 (rate limiting)
- ✅ **GDPR** – Data minimization and user notification
- ✅ **SOC 2** – Access control and audit trails

---

## 📊 Risk Assessment

### Risk Formula
```
Total Risk = Location (0-20) + Keystroke (0-30) + Session Time (0-30) + Unusual Time (0-20)
Maximum: 100 points
```

### Risk Thresholds
| Risk Level | Score | Action | Description |
|------------|-------|--------|-------------|
| 🟢 Low | 0-40 | ✅ Access Granted | Normal behavior |
| 🟡 Medium | 41-70 | 🔐 MFA Required | Suspicious activity |
| 🔴 High | 71-100 | 🚫 Account Blocked | Very suspicious |

### Example Scenarios

**Scenario 1: Normal Login (Score: 5)**
```
Location: 0 km away → 0 pts
Keystrokes: 1 delete → 1 pt
Session: 12 seconds → 4 pts
Time: 10:00 AM (usual) → 0 pts
Result: ✅ Access Granted
```

**Scenario 2: Suspicious (Score: 55)**
```
Location: 50 km away → 20 pts
Keystrokes: 8 deletes → 8 pts
Session: 45 seconds → 15 pts
Time: 2:00 AM (unusual) → 12 pts
Result: 🔐 MFA Required
```

**Scenario 3: High Risk (Score: 90)**
```
Location: 200 km away → 20 pts (max)
Keystrokes: 25 deletes → 25 pts
Session: 90 seconds → 30 pts (max)
Time: 3:00 AM (unusual) → 15 pts
Result: 🚫 Account Blocked
```

---

## 📁 Project Structure

```
devvault/
├── Backend/
│   ├── config/
│   │   └── s3Config.js              # AWS S3 configuration
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── AccessLog.js             # Access log schema
│   │   ├── File.js                  # File metadata
│   │   ├── OTP.js                   # OTP schema
│   │   ├── AdminSettings.js         # Admin settings
│   │   └── Feedback.js              # Feedback schema
│   ├── routes/
│   │   ├── auth.js                  # Auth endpoints
│   │   ├── user.js                  # User endpoints
│   │   └── admin.js                 # Admin endpoints
│   ├── utils/
│   │   ├── riskCalculator.js        # Risk scoring engine
│   │   └── emailService.js          # Email notifications
│   ├── server.js                    # Express server
│   └── package.json                 # Dependencies
├── Frontend/
│   ├── js/
│   │   ├── auth.js                  # Auth logic
│   │   ├── config.js                # API config
│   │   ├── user-dashboard.js        # User dashboard
│   │   ├── admin-dashboard.js       # Admin dashboard
│   │   └── webauthn.js              # WebAuthn (ready)
│   ├── index.html                   # Login/Signup
│   ├── user-dashboard.html          # User dashboard
│   ├── admin-dashboard.html         # Admin dashboard
│   ├── access-control.html          # Access decision
│   └── styles.css                   # Global styles
├── setup.sh                         # Automated setup
├── vercel.json                      # Vercel config
└── README.md                        # This file
```

---

## 🧪 Testing

### Run Migration
```bash
cd Backend
npm run migrate:brute-force
```

### Test Brute Force
```bash
npm run test:brute-force
```

### Manual Testing Checklist
- [ ] User registration with location
- [ ] Login with correct credentials (low risk)
- [ ] Login from different location (medium risk)
- [ ] MFA flow with OTP
- [ ] 3 failed login attempts (brute force)
- [ ] Email notifications
- [ ] Auto-unlock after 4 hours
- [ ] File upload/download
- [ ] Admin dashboard

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check MongoDB URI, verify .env variables |
| Location not working | Enable browser location, use HTTPS in production |
| File upload fails | Verify AWS credentials, check S3 permissions |
| OTP not received | Use Gmail App Password, check spam folder |
| Account locked | Wait 4 hours or contact admin |

---

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] 🤖 Machine learning-based anomaly detection
- [ ] 📱 Device fingerprinting
- [ ] 📲 SMS notifications
- [ ] 🔐 CAPTCHA integration
- [ ] 🌐 IP-based tracking
- [ ] 🚨 Real-time admin alerts
- [ ] 📱 Mobile app (React Native)
- [ ] 📊 Advanced analytics dashboard
- [ ] 🛡️ Threat intelligence integration
- [ ] 🌍 Multi-language support

---
