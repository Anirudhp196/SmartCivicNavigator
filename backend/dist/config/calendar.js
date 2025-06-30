"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendar = exports.SCOPES = exports.oauth2Client = void 0;
const googleapis_1 = require("googleapis");
// These would typically come from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5000/api/calendar/oauth2callback';
// Create OAuth2 client
exports.oauth2Client = new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
// Define the scopes we need
exports.SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
];
// Create Calendar API client
exports.calendar = googleapis_1.google.calendar({ version: 'v3', auth: exports.oauth2Client });
