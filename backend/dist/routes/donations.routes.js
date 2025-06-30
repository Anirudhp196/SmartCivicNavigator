"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Donation_1 = require("../models/Donation");
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
// Donation validation schema
const donationSchema = {
    organizationId: {
        isMongoId: true,
        errorMessage: 'Valid organization ID is required'
    },
    amount: {
        isFloat: {
            options: { min: 0.50 },
            errorMessage: 'Amount must be at least 0.50'
        },
        custom: {
            options: (value) => {
                return Number(value.toFixed(2)) === value;
            },
            errorMessage: 'Amount cannot have more than 2 decimal places'
        }
    },
    currency: {
        isIn: {
            options: [['USD']],
            errorMessage: 'Only USD is supported at this time'
        }
    },
    paymentMethod: {
        isIn: {
            options: [['STRIPE', 'PAYPAL']],
            errorMessage: 'Invalid payment method'
        }
    },
    isRecurring: {
        isBoolean: true,
        errorMessage: 'isRecurring must be a boolean'
    },
    recurringInterval: {
        optional: true,
        isIn: {
            options: [['MONTHLY', 'QUARTERLY', 'YEARLY']],
            errorMessage: 'Invalid recurring interval'
        },
        custom: {
            options: (value, { req }) => {
                if (req.body.isRecurring && !value) {
                    throw new Error('Recurring interval is required for recurring donations');
                }
                return true;
            }
        }
    },
    description: {
        optional: true,
        isLength: {
            options: { max: 500 },
            errorMessage: 'Description cannot exceed 500 characters'
        }
    }
};
// Create donation (initiate payment)
router.post('/', auth_1.protect, (req, res, next) => {
    const validationChains = (0, express_validator_1.checkSchema)(donationSchema);
    Promise.all(validationChains.map(chain => chain.run(req)))
        .then(() => next())
        .catch(next);
}, handleValidationErrors, async (req, res) => {
    try {
        // In a real implementation, you would:
        // 1. Create a payment intent with Stripe/PayPal
        // 2. Return client secret/payment URL
        // 3. Create donation record with PENDING status
        const donationData = {
            ...req.body,
            userId: req.user?._id,
            status: 'PENDING',
            paymentId: `test_${Date.now()}` // This would come from payment provider
        };
        const donation = await Donation_1.Donation.create(donationData);
        res.status(201).json({
            success: true,
            data: {
                donation,
                // This would include payment provider specific data
                paymentInfo: {
                    clientSecret: 'test_client_secret',
                    paymentUrl: 'https://example.com/pay'
                }
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
// Get user's donations
router.get('/my-donations', auth_1.protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [donations, total] = await Promise.all([
            Donation_1.Donation.find({ userId: req.user?._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('organizationId', 'name organizationName'),
            Donation_1.Donation.countDocuments({ userId: req.user?._id })
        ]);
        res.json({
            success: true,
            data: donations,
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
// Get organization's received donations
router.get('/organization/:organizationId', auth_1.protect, async (req, res) => {
    try {
        // Check if user is authorized (admin or the organization itself)
        if (!req.user?.isNonProfit || req.user?._id.toString() !== req.params.organizationId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these donations'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [donations, total] = await Promise.all([
            Donation_1.Donation.find({ organizationId: req.params.organizationId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name email'),
            Donation_1.Donation.countDocuments({ organizationId: req.params.organizationId })
        ]);
        res.json({
            success: true,
            data: donations,
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
// Get organization's donation statistics
router.get('/organization/:organizationId/stats', auth_1.protect, async (req, res) => {
    try {
        // Check if user is authorized (admin or the organization itself)
        if (!req.user?.isNonProfit || req.user?._id.toString() !== req.params.organizationId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these statistics'
            });
        }
        const stats = await Donation_1.Donation.getOrganizationStats(req.params.organizationId);
        res.json({
            success: true,
            data: stats[0] || {
                totalAmount: 0,
                averageDonation: 0,
                totalDonors: 0,
                recurringDonations: 0
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
// Process refund
router.post('/:id/refund', auth_1.protect, async (req, res) => {
    try {
        const donation = await Donation_1.Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }
        // Check if user is authorized (admin or the organization that received the donation)
        if (!req.user?.isNonProfit || req.user?._id.toString() !== donation.organizationId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to refund this donation'
            });
        }
        // Validate refund reason
        if (!req.body.reason) {
            return res.status(400).json({
                success: false,
                message: 'Refund reason is required'
            });
        }
        await donation.processRefund(req.body.reason);
        res.json({
            success: true,
            message: 'Donation refunded successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Webhook endpoint for payment provider callbacks
router.post('/webhook', async (req, res) => {
    try {
        // In a real implementation, you would:
        // 1. Verify webhook signature
        // 2. Parse event data
        // 3. Update donation status accordingly
        // 4. Handle different event types (payment_success, payment_failed, etc.)
        res.json({ received: true });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
