const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AccessLog = require('../models/AccessLog');
const Feedback = require('../models/Feedback');
const AdminSettings = require('../models/AdminSettings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all access logs (excluding admin)
router.get('/access-logs', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const logs = await AccessLog.find()
            .populate('userId', 'username')
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all registered users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Block/Unblock user
router.put('/users/:userId/block', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { isBlocked } = req.body;

        const updateData = { isBlocked };

        // If unblocking, clear the blockedUntil timestamp
        if (!isBlocked) {
            updateData.blockedUntil = null;
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error updating user block status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Also delete user's access logs and feedback
        await AccessLog.deleteMany({ userId: req.params.userId });
        await Feedback.deleteMany({ userId: req.params.userId });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all feedback
router.get('/feedback', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark feedback as read
router.put('/feedback/:feedbackId/read', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.feedbackId,
            { isRead: true },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        res.json({ message: 'Feedback marked as read' });
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get admin statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isAdmin: false });
        const totalFeedback = await Feedback.countDocuments();
        const totalAccessLogs = await AccessLog.countDocuments();
        const blockedUsers = await User.countDocuments({ isBlocked: true });

        res.json({
            totalUsers,
            totalFeedback,
            totalAccessLogs,
            blockedUsers
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get/Update unusual time settings
router.get('/settings/unusual-time', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();

        if (!settings) {
            settings = new AdminSettings({ unusualTimeRanges: [] });
            await settings.save();
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/settings/unusual-time', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { unusualTimeRanges } = req.body;

        let settings = await AdminSettings.findOne();

        if (!settings) {
            settings = new AdminSettings({ unusualTimeRanges });
        } else {
            settings.unusualTimeRanges = unusualTimeRanges;
            settings.updatedAt = Date.now();
        }

        await settings.save();

        res.json({
            message: 'Unusual time settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
