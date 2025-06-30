"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTestDB = exports.clearTestDB = exports.setupTestDB = void 0;
const dotenv_1 = require("dotenv");
const mongoose_1 = __importDefault(require("mongoose"));
// Load environment variables
(0, dotenv_1.config)();
// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-civic-navigator-test';
// Function to connect to test database
const setupTestDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose_1.default.connect(mongoUri);
    }
    catch (error) {
        console.error('Error connecting to test database:', error);
        process.exit(1);
    }
};
exports.setupTestDB = setupTestDB;
// Function to clear test database
const clearTestDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        const collections = await mongoose_1.default.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
};
exports.clearTestDB = clearTestDB;
// Function to close database connection
const closeTestDB = async () => {
    await mongoose_1.default.connection.close();
};
exports.closeTestDB = closeTestDB;
