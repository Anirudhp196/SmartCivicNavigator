import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { protect, restrictTo, optionalAuth } from '../middleware/auth';
import { User, IUser } from '../models/User';

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
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
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
            await protect(mockReq as Request, mockRes as Response, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized, no token'
            });
        });

        it('should accept token from cookie', async () => {
            const token = 'valid.jwt.token';
            mockReq.cookies = { jwt: token };
            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
            (User.findById as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));

            await protect(mockReq as Request, mockRes as Response, mockNext);
            
            expect(jwt.verify).toHaveBeenCalledWith(token, 'defaultsecret');
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
        });

        it('should accept token from Authorization header', async () => {
            const token = 'valid.jwt.token';
            mockReq.headers = { authorization: `Bearer ${token}` };
            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
            (User.findById as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));

            await protect(mockReq as Request, mockRes as Response, mockNext);
            
            expect(jwt.verify).toHaveBeenCalledWith(token, 'defaultsecret');
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
        });
    });

    describe('restrictTo middleware', () => {
        it('should allow access for correct role', () => {
            mockReq.user = { role: 'nonprofit-admin' } as IUser;
            const middleware = restrictTo('nonprofit-admin');

            middleware(mockReq as Request, mockRes as Response, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for incorrect role', () => {
            mockReq.user = { role: 'resident' } as IUser;
            const middleware = restrictTo('nonprofit-admin');

            middleware(mockReq as Request, mockRes as Response, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. resident role cannot perform this action.'
            });
        });
    });

    describe('optionalAuth middleware', () => {
        it('should proceed without user if no token provided', async () => {
            await optionalAuth(mockReq as Request, mockRes as Response, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        });

        it('should attach user if valid token provided', async () => {
            const token = 'valid.jwt.token';
            mockReq.cookies = { jwt: token };
            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
            (User.findById as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));

            await optionalAuth(mockReq as Request, mockRes as Response, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user).toEqual(mockUser);
        });
    });
}); 