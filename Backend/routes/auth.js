const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AccessLog = require('../models/AccessLog');
const AdminSettings = require('../models/AdminSettings');
const OTP = require('../models/OTP');
const {
    calculateLocationScore,
    calculateKeystrokeScore,
    calculateSessionTimeScore,
    calculateUnusualTimeScore,
    calculateTotalRiskScore,
    determineAction
} = require('../utils/riskCalculator');
const { generateOTP, sendOTP, sendHighRiskWarning, sendBlockedNotification, sendForgotPassword } = require('../utils/emailService');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, location, otpEmail } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            password: hashedPassword,
            registeredLocation: {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || ''
            },
            otpEmail: otpEmail || null
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login - Calculate risk score
router.post('/login', async (req, res) => {
    try {
        const {
            username,
            password,
            location,
            deleteCount,
            sessionTime
        } = req.body;

        // Check for admin login
        if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { userId: 'admin', username, isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: { username, isAdmin: true },
                action: 'access_granted'
            });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            // Check if block has expired (4 hours)
            if (user.blockedUntil && new Date() < user.blockedUntil) {
                const remainingTime = Math.ceil((user.blockedUntil - new Date()) / (1000 * 60)); // minutes
                return res.status(403).json({
                    message: `Your account is blocked. Please wait ${remainingTime} minutes or contact admin.`,
                    action: 'blocked',
                    blockedUntil: user.blockedUntil
                });
            } else if (user.blockedUntil && new Date() >= user.blockedUntil) {
                // Auto-unblock after 4 hours
                user.isBlocked = false;
                user.blockedUntil = null;
                await user.save();
            } else {
                // Permanently blocked by admin
                return res.status(403).json({
                    message: 'Your account has been blocked. Please contact admin.',
                    action: 'blocked'
                });
            }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Get admin settings for usual time
        const adminSettings = await AdminSettings.findOne();
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Calculate risk scores
        const locationScore = calculateLocationScore(
            user.registeredLocation.latitude,
            user.registeredLocation.longitude,
            location.latitude,
            location.longitude
        );

        const keystrokeScore = calculateKeystrokeScore(deleteCount);
        const sessionTimeScore = calculateSessionTimeScore(sessionTime);
        const unusualTimeScore = calculateUnusualTimeScore(
            currentTime,
            adminSettings?.unusualTimeRanges || []
        );

        const totalRiskScore = calculateTotalRiskScore(
            locationScore,
            keystrokeScore,
            sessionTimeScore,
            unusualTimeScore
        );

        const action = determineAction(totalRiskScore);

        // Create access log
        const accessLog = new AccessLog({
            userId: user._id,
            username: user.username,
            location: {
                latitude: location.latitude,
                longitude: location.longitude
            },
            riskFactors: {
                locationAnomaly: {
                    score: locationScore,
                    maxScore: 20
                },
                keystrokeAnomaly: {
                    score: keystrokeScore,
                    maxScore: 30,
                    deleteCount
                },
                sessionTime: {
                    score: sessionTimeScore,
                    maxScore: 30,
                    duration: sessionTime
                },
                unusualTime: {
                    score: unusualTimeScore,
                    maxScore: 20
                }
            },
            totalRiskScore,
            action,
            loginSuccess: false
        });

        await accessLog.save();

        // Handle different risk levels
        if (totalRiskScore > 70) {
            // High Risk: Block for 4 hours
            user.isBlocked = true;
            user.blockedUntil = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
            await user.save();

            // Send blocked notification email
            if (user.otpEmail) {
                await sendBlockedNotification(user.otpEmail, user.username);
            }

            return res.status(403).json({
                message: 'High Risk: You have been blocked for 4 hours or contact admin to unblock you',
                action: 'blocked',
                riskScore: totalRiskScore,
                blockedUntil: user.blockedUntil
            });
        }

        if (totalRiskScore > 40 && totalRiskScore <= 70) {
            // Medium Risk: Require MFA
            if (!user.otpEmail) {
                return res.status(400).json({
                    message: 'MFA required but no OTP email registered. Please contact admin.',
                    action: 'mfa_required_no_email',
                    riskScore: totalRiskScore
                });
            }

            const otpCode = generateOTP();
            
            // Delete any existing OTPs for this user
            await OTP.deleteMany({ userId: user._id });
            
            // Store OTP in MongoDB with enhanced security
            const otpRecord = new OTP({
                userId: user._id,
                otp: otpCode,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                accessLogId: accessLog._id,
                attempts: 0
            });
            
            await otpRecord.save();

            await sendOTP(user.otpEmail, otpCode);

            // Send high risk warning email
            await sendHighRiskWarning(user.otpEmail, user.username);

            return res.json({
                action: 'mfa_required',
                message: 'Medium Risk: MFA required. OTP sent to your registered email',
                userId: user._id,
                riskScore: totalRiskScore,
                otpEmail: user.otpEmail
            });
        }

        // Low Risk (0-40): Access granted
        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: false },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        accessLog.loginSuccess = true;
        await accessLog.save();

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                isAdmin: false
            },
            action: 'access_granted',
            riskScore: totalRiskScore
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Verify MFA (OTP)
router.post('/verify-mfa', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the OTP record from MongoDB
        const otpRecord = await OTP.findOne({ 
            userId: user._id,
            verified: false
        }).sort({ createdAt: -1 }); // Get the most recent OTP

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not found' });
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Increment attempt counter for security
        otpRecord.attempts += 1;
        await otpRecord.save();

        // Check for too many attempts (max 5)
        if (otpRecord.attempts > 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            return res.status(401).json({ 
                message: 'Invalid OTP',
                attemptsRemaining: 5 - otpRecord.attempts
            });
        }

        // OTP is valid - mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Update access log
        if (otpRecord.accessLogId) {
            await AccessLog.findByIdAndUpdate(otpRecord.accessLogId, {
                mfaCompleted: true,
                loginSuccess: true
            });
        }

        // Delete the OTP after successful verification
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: false },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                isAdmin: false
            },
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ message: 'Server error during MFA verification' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpEmail) {
            return res.status(400).json({ message: 'No OTP email registered for this account' });
        }

        // Note: In production, you should NEVER send plain passwords
        // This is only for demonstration as requested
        // Ideally, send a password reset link instead
        const plainPassword = user.password; // This is hashed, we can't retrieve plain password

        // Since we can't retrieve the plain password, we'll send a reset link instead
        // But as per requirements, we need to send the password
        // So we'll generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        user.password = hashedTempPassword;
        await user.save();

        await sendForgotPassword(user.otpEmail, user.username, tempPassword);

        res.json({ message: 'A temporary password has been sent to your registered email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password recovery' });
    }
});

module.exports = router;
