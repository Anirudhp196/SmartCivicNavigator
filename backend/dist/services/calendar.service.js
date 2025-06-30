"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const calendar_1 = require("../config/calendar");
class CalendarService {
    /**
     * Get OAuth2 URL for user authorization
     */
    static getAuthUrl() {
        return calendar_1.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: calendar_1.SCOPES
        });
    }
    /**
     * Set credentials from OAuth2 callback code
     */
    static async setCredentials(code) {
        const { tokens } = await calendar_1.oauth2Client.getToken(code);
        calendar_1.oauth2Client.setCredentials(tokens);
    }
    /**
     * Create a calendar event for volunteer signup
     */
    static async createVolunteerEvent(signup, service) {
        try {
            const event = {
                summary: `Volunteer: ${service.name}`,
                description: `Volunteer signup for ${service.name}\n\nRole: ${signup.role || 'General Volunteer'}\nNotes: ${signup.notes || 'No additional notes'}`,
                start: {
                    dateTime: signup.startTime.toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: signup.endTime.toISOString(),
                    timeZone: 'UTC'
                },
                attendees: [], // This would be populated with volunteer and organization emails
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 day before
                        { method: 'popup', minutes: 60 } // 1 hour before
                    ]
                }
            };
            const response = await calendar_1.calendar.events.insert({
                calendarId: 'primary',
                requestBody: event
            });
            return response.data.id || '';
        }
        catch (error) {
            console.error('Error creating calendar event:', error);
            throw new Error('Failed to create calendar event');
        }
    }
    /**
     * Update a calendar event
     */
    static async updateVolunteerEvent(eventId, signup, service) {
        try {
            const event = {
                summary: `Volunteer: ${service.name}`,
                description: `Volunteer signup for ${service.name}\n\nRole: ${signup.role || 'General Volunteer'}\nNotes: ${signup.notes || 'No additional notes'}\nStatus: ${signup.status}`,
                start: {
                    dateTime: signup.startTime.toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: signup.endTime.toISOString(),
                    timeZone: 'UTC'
                }
            };
            await calendar_1.calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: event
            });
        }
        catch (error) {
            console.error('Error updating calendar event:', error);
            throw new Error('Failed to update calendar event');
        }
    }
    /**
     * Delete a calendar event
     */
    static async deleteVolunteerEvent(eventId) {
        try {
            await calendar_1.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });
        }
        catch (error) {
            console.error('Error deleting calendar event:', error);
            throw new Error('Failed to delete calendar event');
        }
    }
    /**
     * Get upcoming volunteer events
     */
    static async getUpcomingEvents(timeMin = new Date()) {
        try {
            const response = await calendar_1.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime'
            });
            return response.data.items || [];
        }
        catch (error) {
            console.error('Error fetching calendar events:', error);
            throw new Error('Failed to fetch calendar events');
        }
    }
}
exports.CalendarService = CalendarService;
