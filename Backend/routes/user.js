const express = require('express');
const router = express.Router();
const User = require('../models/User');
const File = require('../models/File');
const Feedback = require('../models/Feedback');
const { authMiddleware } = require('../middleware/auth');
const { upload, deleteFileFromS3, getSignedUrl, s3 } = require('../config/s3Config');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update MFA settings (OTP Email only)
router.put('/mfa', authMiddleware, async (req, res) => {
    try {
        const { otpEmail } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.otpEmail = otpEmail;
        await user.save();

        res.json({
            message: 'OTP email updated successfully',
            otpEmail: user.otpEmail
        });
    } catch (error) {
        console.error('Error updating MFA:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.put('/reset-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = new File({
            userId: req.user.userId,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileKey: req.file.key,
            fileUrl: req.file.location
        });

        await file.save();

        // Update user statistics
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: {
                filesUploaded: 1,
                storageUsed: req.file.size
            }
        });

        res.json({
            message: 'File uploaded successfully',
            file: {
                id: file._id,
                fileName: file.fileName,
                fileSize: file.fileSize,
                uploadedAt: file.uploadedAt
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server error during file upload' });
    }
});

// Get user files
router.get('/files', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user.userId })
            .populate('sharedWith', 'username')
            .sort({ uploadedAt: -1 });

        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get shared files
router.get('/shared-files', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ sharedWith: req.user.userId })
            .populate('userId', 'username')
            .sort({ uploadedAt: -1 });

        res.json(files);
    } catch (error) {
        console.error('Error fetching shared files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete file
router.delete('/files/:fileId', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            userId: req.user.userId
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete from S3
        await deleteFileFromS3(file.fileKey);

        // Update user statistics
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: {
                filesUploaded: -1,
                storageUsed: -file.fileSize
            }
        });

        // Delete from database
        await File.findByIdAndDelete(req.params.fileId);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Share file
router.post('/files/:fileId/share', authMiddleware, async (req, res) => {
    try {
        const { userIds } = req.body; // Array of user IDs to share with

        const file = await File.findOne({
            _id: req.params.fileId,
            userId: req.user.userId
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Add users to sharedWith array (avoid duplicates)
        const newShares = userIds.filter(id => !file.sharedWith.includes(id));
        file.sharedWith.push(...newShares);
        await file.save();

        res.json({ message: 'File shared successfully' });
    } catch (error) {
        console.error('Error sharing file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file (Backend Proxy Pattern)
router.get('/files/:fileId/download', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({
            $or: [
                { _id: req.params.fileId, userId: req.user.userId },
                { _id: req.params.fileId, sharedWith: req.user.userId }
            ]
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        // Get file from S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.fileKey
        };

        try {
            // Get file from S3
            const s3Object = await s3.getObject(params).promise();

            // Set proper headers for download
            res.setHeader('Content-Type', s3Object.ContentType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
            res.setHeader('Content-Length', s3Object.ContentLength || file.fileSize);

            // Stream file to client
            res.send(s3Object.Body);

            console.log(`File downloaded: ${file.fileName} by user ${req.user.userId}`);
        } catch (s3Error) {
            console.error('S3 download error:', s3Error);
            return res.status(500).json({
                message: 'Error downloading file from storage',
                error: s3Error.message
            });
        }
    } catch (error) {
        console.error('Error in download route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (for sharing)
router.get('/all-users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user.userId },
            isAdmin: false
        }).select('_id username');

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit feedback
router.post('/feedback', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        const feedback = new Feedback({
            userId: req.user.userId,
            userEmail: req.user.username,
            message
        });

        await feedback.save();

        res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        res.json({
            filesUploaded: user.filesUploaded,
            storageUsed: user.storageUsed
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
