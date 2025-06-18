import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import authRoutes from '../routes/auth.routes';
import { setupTestDB, clearTestDB, closeTestDB } from './setup';
import { validationResult, ValidationError } from 'express-validator';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

jest.mock('../models/User');
jest.mock('jsonwebtoken');

// Mock express-validator
jest.mock('express-validator', () => {
    const mockValidationChain = {
        run: jest.fn().mockImplementation(() => Promise.resolve())
    };

    const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
    };

    return {
        checkSchema: jest.fn().mockReturnValue([mockValidationChain]),
        validationResult: jest.fn().mockReturnValue(mockValidationResult)
    };
});

describe('Auth Routes', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
        jest.clearAllMocks();
        // Reset validation result mock
        const { validationResult } = require('express-validator');
        (validationResult as jest.Mock).mockReturnValue({
            isEmpty: () => true,
            array: () => []
        });
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/auth/register', () => {
        const validUser = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            location: {
                coordinates: [0, 0]
            },
            isNonProfit: false
        };

        it('should register a new user successfully', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockResolvedValue({
                ...validUser,
                _id: 'user123',
                role: 'resident'
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should require email validation', async () => {
            const { validationResult } = require('express-validator');
            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Please enter a valid email' }]
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, email: 'invalid-email' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                role: 'resident',
                comparePassword: jest.fn().mockResolvedValue(true)
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should fail with incorrect password', async () => {
            const mockUser = {
                comparePassword: jest.fn().mockResolvedValue(false)
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear the jwt cookie', async () => {
            const res = await request(app)
                .post('/api/auth/logout');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie'][0]).toMatch(/jwt=;/);
        });
    });

    describe('PATCH /api/auth/me', () => {
        it('should update user profile when authenticated', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Old Name'
            };

            const updatedUser = {
                _id: 'user123',
                name: 'New Name'
            };

            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
            (User.findById as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));
            (User.findByIdAndUpdate as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockResolvedValue(updatedUser)
            }));

            const res = await request(app)
                .patch('/api/auth/me')
                .set('Cookie', ['jwt=valid-token'])
                .send({ name: 'New Name' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('New Name');
        });
    });

    describe('POST /api/auth/change-password', () => {
        it('should change password when current password is correct', async () => {
            const mockUser = {
                _id: 'user123',
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true)
            };

            (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
            (User.findById as jest.Mock)
                .mockImplementationOnce(() => ({
                    select: jest.fn().mockReturnThis(),
                    lean: jest.fn().mockResolvedValue(mockUser)
                }))
                .mockImplementationOnce(() => mockUser);

            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Cookie', ['jwt=valid-token'])
                .send({
                    currentPassword: 'oldpassword',
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
}); 