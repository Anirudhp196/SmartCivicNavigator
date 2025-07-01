import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import servicesRoutes from './routes/services.routes';
import donationsRoutes from './routes/donations.routes';
import volunteerRoutes from './routes/volunteer.routes';
import calendarRoutes from './routes/calendar.routes';

// Load environment variables
config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary: Broaden CORS to debug preflight. Ensure this is placed before routes.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Keep this if you're sending cookies/auth headers
}));

// Handle preflight requests (OPTIONS method) explicitly
app.options('*', cors()); // Respond to preflight requests for all routes

app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handling
app.use(errorHandler);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 