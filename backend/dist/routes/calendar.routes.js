"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendar_service_1 = require("../services/calendar.service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get OAuth2 authorization URL
router.get('/auth-url', auth_1.protect, (req, res) => {
    try {
        const url = calendar_service_1.CalendarService.getAuthUrl();
        res.json({
            success: true,
            data: { url }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Handle OAuth2 callback
router.get('/oauth2callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }
        await calendar_service_1.CalendarService.setCredentials(code);
        // In a real implementation, you would:
        // 1. Store the tokens in the database
        // 2. Associate them with the user
        // 3. Redirect to the frontend with success message
        res.json({
            success: true,
            message: 'Calendar authorization successful'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Get upcoming events
router.get('/events', auth_1.protect, async (req, res) => {
    try {
        const events = await calendar_service_1.CalendarService.getUpcomingEvents();
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
