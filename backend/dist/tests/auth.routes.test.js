"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const setup_1 = require("./setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_routes_1.default);
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
        await (0, setup_1.setupTestDB)();
    });
    afterEach(async () => {
        await (0, setup_1.clearTestDB)();
        jest.clearAllMocks();
        // Reset validation result mock
        const { validationResult } = require('express-validator');
        validationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => []
        });
    });
    afterAll(async () => {
        await (0, setup_1.closeTestDB)();
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
            User_1.User.findOne.mockResolvedValue(null);
            User_1.User.create.mockResolvedValue({
                ...validUser,
                _id: 'user123',
                role: 'resident'
            });
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validUser);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.headers['set-cookie']).toBeDefined();
        });
        it('should require email validation', async () => {
            const { validationResult } = require('express-validator');
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Please enter a valid email' }]
            });
            const res = await (0, supertest_1.default)(app)
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
            User_1.User.findOne.mockResolvedValue(mockUser);
            const res = await (0, supertest_1.default)(app)
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
            User_1.User.findOne.mockResolvedValue(mockUser);
            const res = await (0, supertest_1.default)(app)
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
            const res = await (0, supertest_1.default)(app)
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
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user123' });
            User_1.User.findById.mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }));
            User_1.User.findByIdAndUpdate.mockImplementation(() => ({
                select: jest.fn().mockResolvedValue(updatedUser)
            }));
            const res = await (0, supertest_1.default)(app)
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
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user123' });
            User_1.User.findById
                .mockImplementationOnce(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUser)
            }))
                .mockImplementationOnce(() => mockUser);
            const res = await (0, supertest_1.default)(app)
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
