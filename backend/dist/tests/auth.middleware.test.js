"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
// Mock User model and jwt
jest.mock('../models/User', () => ({
    User: {
        findById: jest.fn()
    }
}));
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));
describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    const mockUser = {
        _id: 'user123',
        role: 'resident'
    };
    beforeEach(() => {
        mockReq = {
            cookies: {},
            headers: {},
            user: undefined
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });
    describe('protect middleware', () => {
        it('should return 401 if no token is provided', async () => {
            await (0, auth_1.protect)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized, no token'
            });
        });
        it('should accept token from cookie', async () => {
            const token = 'valid.jwt.token';
            mockReq.cookies = { jwt: token };
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user123' });
            User_1.User.findById.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));
            await (0, auth_1.protect)(mockReq, mockRes, mockNext);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith(token, 'defaultsecret');
            expect(User_1.User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
        });
        it('should accept token from Authorization header', async () => {
            const token = 'valid.jwt.token';
            mockReq.headers = { authorization: `Bearer ${token}` };
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user123' });
            User_1.User.findById.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));
            await (0, auth_1.protect)(mockReq, mockRes, mockNext);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith(token, 'defaultsecret');
            expect(User_1.User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
        });
    });
    describe('restrictTo middleware', () => {
        it('should allow access for correct role', () => {
            mockReq.user = { role: 'nonprofit-admin' };
            const middleware = (0, auth_1.restrictTo)('nonprofit-admin');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should deny access for incorrect role', () => {
            mockReq.user = { role: 'resident' };
            const middleware = (0, auth_1.restrictTo)('nonprofit-admin');
            middleware(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. resident role cannot perform this action.'
            });
        });
    });
    describe('optionalAuth middleware', () => {
        it('should proceed without user if no token provided', async () => {
            await (0, auth_1.optionalAuth)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        });
        it('should attach user if valid token provided', async () => {
            const token = 'valid.jwt.token';
            mockReq.cookies = { jwt: token };
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user123' });
            User_1.User.findById.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));
            await (0, auth_1.optionalAuth)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user).toEqual(mockUser);
        });
    });
});
