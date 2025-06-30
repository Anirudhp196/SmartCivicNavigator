"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
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
// Service validation schema
const serviceSchema = {
    name: {
        trim: true,
        notEmpty: true,
        errorMessage: 'Service name is required'
    },
    description: {
        trim: true,
        notEmpty: true,
        errorMessage: 'Description is required'
    },
    category: {
        isIn: {
            options: [['FOOD_BANK', 'MENTAL_HEALTH', 'HOUSING', 'EDUCATION', 'HEALTHCARE', 'LEGAL', 'OTHER']],
            errorMessage: 'Invalid category'
        }
    },
    'location.coordinates': {
        isArray: {
            options: { min: 2, max: 2 },
            errorMessage: 'Location must be [longitude, latitude]'
        },
        custom: {
            options: (value) => {
                if (!Array.isArray(value))
                    return false;
                const [lng, lat] = value;
                return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
            },
            errorMessage: 'Invalid coordinates'
        }
    },
    hours: {
        isArray: true,
        errorMessage: 'Operating hours are required'
    },
    'hours.*.day': {
        isIn: {
            options: [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']],
            errorMessage: 'Invalid day'
        }
    },
    'hours.*.open': {
        matches: {
            options: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            errorMessage: 'Invalid opening time format (HH:mm)'
        }
    },
    'hours.*.close': {
        matches: {
            options: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            errorMessage: 'Invalid closing time format (HH:mm)'
        }
    },
    contactPhone: {
        optional: true,
        matches: {
            options: /^\+?[1-9]\d{1,14}$/,
            errorMessage: 'Invalid phone number format'
        }
    },
    contactEmail: {
        optional: true,
        isEmail: true,
        errorMessage: 'Invalid email format'
    },
    website: {
        optional: true,
        isURL: true,
        errorMessage: 'Invalid website URL'
    },
    capacity: {
        optional: true,
        isInt: {
            options: { min: 0 },
            errorMessage: 'Capacity must be a positive number'
        }
    },
    tags: {
        optional: true,
        isArray: true,
        errorMessage: 'Tags must be an array'
    }
};
// Create service
router.post('/', auth_1.protect, (0, auth_1.restrictTo)('nonprofit-admin'), (req, res, next) => {
    const validationChains = (0, express_validator_1.checkSchema)(serviceSchema);
    Promise.all(validationChains.map(chain => chain.run(req)))
        .then(() => next())
        .catch(next);
}, handleValidationErrors, async (req, res) => {
    try {
        const serviceData = {
            ...req.body,
            ownerId: req.user?._id
        };
        const service = await Service_1.Service.create(serviceData);
        res.status(201).json({
            success: true,
            data: service
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Get services with geospatial search
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius = 10000, // Default radius in meters (10km)
        category, tags, search, page = 1, limit = 10 } = req.query;
        const query = {};
        // Add geospatial search if coordinates are provided
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    },
                    $maxDistance: Number(radius)
                }
            };
        }
        // Add category filter
        if (category) {
            query.category = category;
        }
        // Add tags filter
        if (tags) {
            query.tags = { $in: tags.split(',') };
        }
        // Add text search
        if (search) {
            query.$text = { $search: search };
        }
        // Only show active services
        query.isActive = true;
        const skip = (Number(page) - 1) * Number(limit);
        const [services, total] = await Promise.all([
            Service_1.Service.find(query)
                .skip(skip)
                .limit(Number(limit))
                .populate('ownerId', 'name organizationName'),
            Service_1.Service.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: services,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
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
// Get single service
router.get('/:id', async (req, res) => {
    try {
        const service = await Service_1.Service.findById(req.params.id)
            .populate('ownerId', 'name organizationName');
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        res.json({
            success: true,
            data: service
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Update service
router.patch('/:id', auth_1.protect, (0, auth_1.restrictTo)('nonprofit-admin'), async (req, res) => {
    try {
        const service = await Service_1.Service.findOne({
            _id: req.params.id,
            ownerId: req.user?._id
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or unauthorized'
            });
        }
        // Validate update data
        const validationChains = (0, express_validator_1.checkSchema)({
            ...serviceSchema,
            // Make all fields optional for updates
            ...Object.fromEntries(Object.entries(serviceSchema).map(([key, value]) => [
                key,
                { ...value, optional: true }
            ]))
        });
        await Promise.all(validationChains.map(chain => chain.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const updatedService = await Service_1.Service.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
        res.json({
            success: true,
            data: updatedService
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Delete service
router.delete('/:id', auth_1.protect, (0, auth_1.restrictTo)('nonprofit-admin'), async (req, res) => {
    try {
        const service = await Service_1.Service.findOneAndDelete({
            _id: req.params.id,
            ownerId: req.user?._id
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or unauthorized'
            });
        }
        res.json({
            success: true,
            message: 'Service deleted successfully'
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
