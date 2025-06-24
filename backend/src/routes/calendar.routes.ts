import { Router, Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types/express';

const router = Router();

// Get OAuth2 authorization URL
router.get('/auth-url', protect, (req: Request, res: Response) => {
    try {
        const url = CalendarService.getAuthUrl();
        res.json({
            success: true,
            data: { url }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Handle OAuth2 callback
router.get('/oauth2callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        await CalendarService.setCredentials(code);

        // In a real implementation, you would:
        // 1. Store the tokens in the database
        // 2. Associate them with the user
        // 3. Redirect to the frontend with success message

        res.json({
            success: true,
            message: 'Calendar authorization successful'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get upcoming events
router.get('/events', protect, async (req: AuthRequest, res: Response) => {
    try {
        const events = await CalendarService.getUpcomingEvents();
        res.json({
            success: true,
            data: events
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router; 