"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
// Enhanced JWT token verification with additional security checks
const protect = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token;
        if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }
        else if (req.headers.authorization?.startsWith('Bearer ')) {
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
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultsecret');
            // Check token expiration
            if (decoded.exp && decoded.exp < Date.now() / 1000) {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please log in again.'
                });
            }
            // Get user from token
            const user = await User_1.User.findById(decoded.id)
                .select('-password')
                .lean();
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists.'
                });
            }
            // Add user to request
            req.user = user;
            return next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
// Role-based authorization middleware
const restrictTo = (...roles) => {
    return (req, res, next) => {
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
exports.restrictTo = restrictTo;
// Optional auth middleware - doesn't require authentication but attaches user if token exists
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }
        else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultsecret');
            const user = await User_1.User.findById(decoded.id)
                .select('-password')
                .lean();
            if (user) {
                req.user = user;
            }
            return next();
        }
        catch (error) {
            // Don't throw error, just proceed without user
            return next();
        }
    }
    catch (error) {
        // Don't throw error, just proceed without user
        return next();
    }
};
exports.optionalAuth = optionalAuth;
