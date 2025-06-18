import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Enhanced JWT token verification with additional security checks
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookie or Authorization header
    let token: string | undefined;
    
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no token' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'defaultsecret'
      ) as JwtPayload;

      // Check token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }

      // Get user from token
      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.'
        });
      }

      // Add user to request
      req.user = user as IUser;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const restrictTo = (...roles: Array<'resident' | 'nonprofit-admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role cannot perform this action.`
      });
    }

    next();
  };
};

// Optional auth middleware - doesn't require authentication but attaches user if token exists
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'defaultsecret'
      ) as JwtPayload;

      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (user) {
        req.user = user as IUser;
      }

      return next();
    } catch (error) {
      // Don't throw error, just proceed without user
      return next();
    }
  } catch (error) {
    // Don't throw error, just proceed without user
    return next();
  }
}; 