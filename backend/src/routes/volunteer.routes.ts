import { Router, Request, Response, NextFunction } from 'express';
import { checkSchema, validationResult, Schema } from 'express-validator';
import { VolunteerSignup } from '../models/VolunteerSignup';
import { Service } from '../models/Service';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types/express';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }
    next();
};

// Signup validation schema
const signupSchema: Schema = {
    serviceId: {
        isMongoId: true,
        errorMessage: 'Valid service ID is required'
    },
    startTime: {
        isISO8601: true,
        errorMessage: 'Valid start time is required',
        custom: {
            options: (value: string) => {
                return new Date(value) > new Date();
            },
            errorMessage: 'Start time must be in the future'
        }
    },
    endTime: {
        isISO8601: true,
        errorMessage: 'Valid end time is required',
        custom: {
            options: (value: string, { req }) => {
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
router.post('/',
    protect,
    (req: Request, res: Response, next: NextFunction) => {
        const validationChains = checkSchema(signupSchema);
        Promise.all(validationChains.map(chain => chain.run(req)))
            .then(() => next())
            .catch(next);
    },
    handleValidationErrors,
    async (req: AuthRequest, res: Response) => {
        try {
            // Check if service exists and is active
            const service = await Service.findOne({ 
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

            const signup = await VolunteerSignup.create(signupData);

            res.status(201).json({
                success: true,
                data: signup
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get user's volunteer signups
router.get('/my-signups',
    protect,
    async (req: AuthRequest, res: Response) => {
        try {
            const { status, upcoming } = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const query: any = { userId: req.user?._id };

            // Filter by status if provided
            if (status) {
                query.status = status;
            }

            // Filter for upcoming events if requested
            if (upcoming === 'true') {
                query.startTime = { $gt: new Date() };
            }

            const [signups, total] = await Promise.all([
                VolunteerSignup.find(query)
                    .sort({ startTime: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('serviceId', 'name description'),
                VolunteerSignup.countDocuments(query)
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
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get service's volunteer signups
router.get('/service/:serviceId',
    protect,
    async (req: AuthRequest, res: Response) => {
        try {
            const service = await Service.findById(req.params.serviceId);
            
            // Check if user is authorized (admin or service owner)
            if (!service || service.ownerId.toString() !== req.user?._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view these signups'
                });
            }

            const upcomingEvents = await VolunteerSignup.getUpcomingEvents(req.params.serviceId);

            res.json({
                success: true,
                data: upcomingEvents
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update signup status
router.patch('/:id/status',
    protect,
    async (req: AuthRequest, res: Response) => {
        try {
            const signup = await VolunteerSignup.findById(req.params.id);

            if (!signup) {
                return res.status(404).json({
                    success: false,
                    message: 'Signup not found'
                });
            }

            // Check authorization
            const service = await Service.findById(signup.serviceId);
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
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Check in volunteer
router.post('/:id/check-in',
    protect,
    async (req: AuthRequest, res: Response) => {
        try {
            const signup = await VolunteerSignup.findById(req.params.id);

            if (!signup) {
                return res.status(404).json({
                    success: false,
                    message: 'Signup not found'
                });
            }

            // Only service owner can check in volunteers
            const service = await Service.findById(signup.serviceId);
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
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Check out volunteer
router.post('/:id/check-out',
    protect,
    async (req: AuthRequest, res: Response) => {
        try {
            const signup = await VolunteerSignup.findById(req.params.id);

            if (!signup) {
                return res.status(404).json({
                    success: false,
                    message: 'Signup not found'
                });
            }

            // Only service owner can check out volunteers
            const service = await Service.findById(signup.serviceId);
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
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

export default router; 