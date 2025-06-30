"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const VolunteerSignup_1 = require("../models/VolunteerSignup");
const Service_1 = require("../models/Service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};
// Signup validation schema
const signupSchema = {
    serviceId: {
        isMongoId: true,
        errorMessage: 'Valid service ID is required'
    },
    startTime: {
        isISO8601: true,
        errorMessage: 'Valid start time is required',
        custom: {
            options: (value) => {
                return new Date(value) > new Date();
            },
            errorMessage: 'Start time must be in the future'
        }
    },
    endTime: {
        isISO8601: true,
        errorMessage: 'Valid end time is required',
        custom: {
            options: (value, { req }) => {
                return new Date(value) > new Date(req.body.startTime);
            },
            errorMessage: 'End time must be after start time'
        }
    },
    role: {
        optional: true,
        isLength: {
            options: { max: 100 },
            errorMessage: 'Role cannot exceed 100 characters'
        }
    },
    notes: {
        optional: true,
        isLength: {
            options: { max: 500 },
            errorMessage: 'Notes cannot exceed 500 characters'
        }
    }
};
// Create volunteer signup
router.post('/', auth_1.protect, (req, res, next) => {
    const validationChains = (0, express_validator_1.checkSchema)(signupSchema);
    Promise.all(validationChains.map(chain => chain.run(req)))
        .then(() => next())
        .catch(next);
}, handleValidationErrors, async (req, res) => {
    try {
        // Check if service exists and is active
        const service = await Service_1.Service.findOne({
            _id: req.body.serviceId,
            isActive: true
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or inactive'
            });
        }
        const signupData = {
            ...req.body,
            userId: req.user?._id,
            eventId: `vol_${Date.now()}` // In real implementation, this would come from Google Calendar
        };
        const signup = await VolunteerSignup_1.VolunteerSignup.create(signupData);
        res.status(201).json({
            success: true,
            data: signup
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Get user's volunteer signups
router.get('/my-signups', auth_1.protect, async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = { userId: req.user?._id };
        // Filter by status if provided
        if (status) {
            query.status = status;
        }
        // Filter for upcoming events if requested
        if (upcoming === 'true') {
            query.startTime = { $gt: new Date() };
        }
        const [signups, total] = await Promise.all([
            VolunteerSignup_1.VolunteerSignup.find(query)
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limit)
                .populate('serviceId', 'name description'),
            VolunteerSignup_1.VolunteerSignup.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: signups,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Get service's volunteer signups
router.get('/service/:serviceId', auth_1.protect, async (req, res) => {
    try {
        const service = await Service_1.Service.findById(req.params.serviceId);
        // Check if user is authorized (admin or service owner)
        if (!service || service.ownerId.toString() !== req.user?._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these signups'
            });
        }
        const upcomingEvents = await VolunteerSignup_1.VolunteerSignup.getUpcomingEvents(req.params.serviceId);
        res.json({
            success: true,
            data: upcomingEvents
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Update signup status
router.patch('/:id/status', auth_1.protect, async (req, res) => {
    try {
        const signup = await VolunteerSignup_1.VolunteerSignup.findById(req.params.id);
        if (!signup) {
            return res.status(404).json({
                success: false,
                message: 'Signup not found'
            });
        }
        // Check authorization
        const service = await Service_1.Service.findById(signup.serviceId);
        const isServiceOwner = service?.ownerId.toString() === req.user?._id.toString();
        const isVolunteer = signup.userId.toString() === req.user?._id.toString();
        if (!isServiceOwner && !isVolunteer) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this signup'
            });
        }
        // Validate status transition
        const { status } = req.body;
        if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        // Only service owner can confirm, volunteer can only cancel
        if (status === 'CONFIRMED' && !isServiceOwner) {
            return res.status(403).json({
                success: false,
                message: 'Only service owner can confirm signups'
            });
        }
        signup.status = status;
        await signup.save();
        res.json({
            success: true,
            data: signup
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Check in volunteer
router.post('/:id/check-in', auth_1.protect, async (req, res) => {
    try {
        const signup = await VolunteerSignup_1.VolunteerSignup.findById(req.params.id);
        if (!signup) {
            return res.status(404).json({
                success: false,
                message: 'Signup not found'
            });
        }
        // Only service owner can check in volunteers
        const service = await Service_1.Service.findById(signup.serviceId);
        if (service?.ownerId.toString() !== req.user?._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to check in volunteers'
            });
        }
        await signup.checkIn(req.body.notes);
        res.json({
            success: true,
            data: signup
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Check out volunteer
router.post('/:id/check-out', auth_1.protect, async (req, res) => {
    try {
        const signup = await VolunteerSignup_1.VolunteerSignup.findById(req.params.id);
        if (!signup) {
            return res.status(404).json({
                success: false,
                message: 'Signup not found'
            });
        }
        // Only service owner can check out volunteers
        const service = await Service_1.Service.findById(signup.serviceId);
        if (service?.ownerId.toString() !== req.user?._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to check out volunteers'
            });
        }
        await signup.checkOut(req.body.notes);
        res.json({
            success: true,
            data: signup
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
