"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const services_routes_1 = __importDefault(require("./routes/services.routes"));
const donations_routes_1 = __importDefault(require("./routes/donations.routes"));
const volunteer_routes_1 = __importDefault(require("./routes/volunteer.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/services', services_routes_1.default);
app.use('/api/donations', donations_routes_1.default);
app.use('/api/volunteer', volunteer_routes_1.default);
app.use('/api/calendar', calendar_routes_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Connect to MongoDB
(0, database_1.connectDB)();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
