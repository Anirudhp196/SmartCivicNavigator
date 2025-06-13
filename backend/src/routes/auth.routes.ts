import { Router } from 'express';
import type { Request, Response } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth';

const router = Router();

// Register user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    body('location.coordinates')
      .isArray()
      .withMessage('Location coordinates are required'),
    body('isNonProfit').isBoolean(),
    body('organizationName')
      .if(body('isNonProfit').equals('true'))
      .notEmpty()
      .withMessage('Organization name is required for nonprofits')
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password, name, location, isNonProfit, organizationName } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
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

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'defaultsecret',
        { expiresIn: '30d' }
      );

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isNonProfit: user.isNonProfit,
        organizationName: user.organizationName,
        role: user.role
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'defaultsecret',
        { expiresIn: '30d' }
      );

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isNonProfit: user.isNonProfit,
        organizationName: user.organizationName,
        role: user.role
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Logout user
router.post('/logout', (req: Request, res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

export default router; 