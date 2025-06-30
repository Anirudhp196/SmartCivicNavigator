"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Mongoose schema for Service
const serviceSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    category: {
        type: String,
        required: true,
        enum: ['FOOD_BANK', 'MENTAL_HEALTH', 'HOUSING', 'EDUCATION', 'HEALTHCARE', 'LEGAL', 'OTHER']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function (v) {
                    return v.length === 2 &&
                        v[0] >= -180 && v[0] <= 180 && // longitude
                        v[1] >= -90 && v[1] <= 90; // latitude
                },
                message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
            }
        }
    },
    hours: [{
            day: {
                type: String,
                required: true,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            open: {
                type: String,
                required: true,
                match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
            },
            close: {
                type: String,
                required: true,
                match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
            }
        }],
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contactPhone: {
        type: String,
        match: /^\+?[1-9]\d{1,14}$/, // E.164 format
        sparse: true
    },
    contactEmail: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sparse: true
    },
    website: {
        type: String,
        match: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
        sparse: true
    },
    capacity: {
        type: Number,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
            type: String,
            trim: true
        }]
}, {
    timestamps: true
});
// Create geospatial index for location-based queries
serviceSchema.index({ location: '2dsphere' });
// Create compound index for category and isActive for filtered queries
serviceSchema.index({ category: 1, isActive: 1 });
// Create text index for search functionality
serviceSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
});
exports.Service = mongoose_1.default.model('Service', serviceSchema);
