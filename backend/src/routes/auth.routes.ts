import { Router, Request, Response, NextFunction } from 'express';
import { checkSchema, validationResult, ValidationChain, Schema } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { protect, restrictTo } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { RequestHandler } from 'express';

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

// Register validation schema
const registerSchema: Schema = {
    email: {
        isEmail: true,
        errorMessage: 'Please enter a valid email'
    },
    password: {
        isLength: {
            options: { min: 6 },
            errorMessage: 'Password must be at least 6 characters long'
        },
        matches: {
            options: /\d/,
            errorMessage: 'Password must contain a number'
        }
    },
    name: {
        trim: true,
        notEmpty: true,
        errorMessage: 'Name is required'
    },
    'location.coordinates': {
        isArray: true,
        errorMessage: 'Location coordinates are required'
    },
    isNonProfit: {
        isBoolean: true
    },
    organizationName: {
        optional: true,
        custom: {
            options: (value: any, { req }) => {
                if (req.body.isNonProfit === true && !value) {
                    throw new Error('Organization name is required for nonprofits');
                }
                return true;
            }
        }
    }
};

// Login validation schema
const loginSchema: Schema = {
    email: {
        isEmail: true,
        errorMessage: 'Please enter a valid email'
    },
    password: {
        notEmpty: true,
        errorMessage: 'Password is required'
    }
};

// Generate JWT Token
const generateToken = (userId: string): string => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'defaultsecret',
        { expiresIn: '30d' }
    );
};

// Set secure cookie with token
const setTokenCookie = (res: Response, token: string) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

// Register user
router.post('/register', 
    (req: Request, res: Response, next: NextFunction) => {
        const validationChains = checkSchema(registerSchema);
        Promise.all(validationChains.map(chain => chain.run(req)))
            .then(() => next())
            .catch(next);
    },
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { email, password, name, location, isNonProfit, organizationName } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            const user = await User.create({
                email,
                password,
                name,
                location,
                isNonProfit,
                organizationName,
                role: isNonProfit ? 'nonprofit-admin' : 'resident'
            });

            const token = generateToken(user._id);
            setTokenCookie(res, token);

            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isNonProfit: user.isNonProfit,
                    organizationName: user.organizationName,
                    role: user.role
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

// Login user
router.post('/login',
    (req: Request, res: Response, next: NextFunction) => {
        const validationChains = checkSchema(loginSchema);
        Promise.all(validationChains.map(chain => chain.run(req)))
            .then(() => next())
            .catch(next);
    },
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = generateToken(user._id);
            setTokenCookie(res, token);

            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isNonProfit: user.isNonProfit,
                    organizationName: user.organizationName,
                    role: user.role
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

// Logout user
router.post('/logout', (req: Request, res: Response) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        data: req.user
    });
});

// Update user profile
router.patch('/me', protect,
    (req: Request, res: Response, next: NextFunction) => {
        const validationChains = checkSchema({
            name: {
                optional: true,
                trim: true,
                notEmpty: true,
                errorMessage: 'Name cannot be empty'
            },
            'location.coordinates': {
                optional: true,
                isArray: true
            }
        });
        Promise.all(validationChains.map(chain => chain.run(req)))
            .then(() => next())
            .catch(next);
    },
    handleValidationErrors,
    async (req: AuthRequest, res: Response) => {
        try {
            const updates = {
                name: req.body.name,
                location: req.body.location
            };

            const user = await User.findByIdAndUpdate(
                req.user?._id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password');

            res.json({
                success: true,
                data: user
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Change password
router.post('/change-password', protect,
    (req: Request, res: Response, next: NextFunction) => {
        const validationChains = checkSchema({
            currentPassword: {
                notEmpty: true,
                errorMessage: 'Current password is required'
            },
            newPassword: {
                isLength: {
                    options: { min: 6 },
                    errorMessage: 'New password must be at least 6 characters long'
                },
                matches: {
                    options: /\d/,
                    errorMessage: 'New password must contain a number'
                }
            }
        });
        Promise.all(validationChains.map(chain => chain.run(req)))
            .then(() => next())
            .catch(next);
    },
    handleValidationErrors,
    async (req: AuthRequest, res: Response) => {
        try {
            const user = await User.findById(req.user?._id);
            if (!user || !(await user.comparePassword(req.body.currentPassword))) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            user.password = req.body.newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password updated successfully'
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