"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const setup_1 = require("./setup");
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ credentials: true, origin: 'http://localhost:3000' }));
// Routes
app.use('/api/auth', auth_routes_1.default);
beforeAll(async () => {
    await (0, setup_1.setupTestDB)();
});
afterEach(async () => {
    await (0, setup_1.clearTestDB)();
});
afterAll(async () => {
    await (0, setup_1.closeTestDB)();
});
describe('Authentication Routes', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        location: {
            coordinates: [-73.935242, 40.730610], // Valid coordinates: New York City
            type: 'Point'
        },
        isNonProfit: false
    };
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.headers['set-cookie']).toBeDefined();
        });
        it('should not register user with existing email', async () => {
            // First registration
            await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(testUser);
            // Second registration with same email
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('User already exists');
        });
        it('should validate required fields', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'invalid-email',
                password: '123', // too short
                name: '',
                location: { coordinates: [] }
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(testUser);
        });
        it('should login successfully with correct credentials', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password
            });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeDefined();
        });
        it('should not login with incorrect password', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: 'wrongpassword'
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or password');
        });
        it('should not login with non-existent email', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: testUser.password
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });
    describe('GET /api/auth/me', () => {
        let jwtCookie;
        beforeEach(async () => {
            // Register and login a user before each test
            await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(testUser);
            const loginRes = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password
            });
            const cookies = loginRes.headers['set-cookie'];
            jwtCookie = cookies ? cookies[0] : '';
        });
        it('should get current user profile with valid token', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .set('Cookie', jwtCookie);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
        });
        it('should not get profile without token', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized, no token');
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
});
