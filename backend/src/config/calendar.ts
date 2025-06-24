import { google } from 'googleapis';

// These would typically come from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5000/api/calendar/oauth2callback';

// Create OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL
);

// Define the scopes we need
export const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
];

// Create Calendar API client
export const calendar = google.calendar({ version: 'v3', auth: oauth2Client }); 