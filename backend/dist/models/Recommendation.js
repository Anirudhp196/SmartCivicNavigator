"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recommendation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const recommendationSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        validate: {
            validator: function (v) {
                return !isNaN(v) && v >= 0 && v <= 1;
            },
            message: 'Score must be a number between 0 and 1'
        }
    },
    biasMetadata: {
        type: Map,
        of: Number,
        required: true,
        validate: {
            validator: function (v) {
                // Ensure all values are between -1 and 1
                for (const value of v.values()) {
                    if (isNaN(value) || value < -1 || value > 1) {
                        return false;
                    }
                }
                return true;
            },
            message: 'Bias metrics must be numbers between -1 and 1'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastInteraction: {
        type: Date,
        sparse: true
    },
    interactionType: {
        type: String,
        enum: ['VIEWED', 'CLICKED', 'CONTACTED', 'VISITED'],
        sparse: true
    }
}, {
    timestamps: true
});
// Create compound indexes for efficient querying
recommendationSchema.index({ userId: 1, serviceId: 1 }, { unique: true });
recommendationSchema.index({ userId: 1, score: -1 }); // For getting top recommendations for a user
recommendationSchema.index({ serviceId: 1, score: -1 }); // For analyzing service popularity
// Add a method to update interaction
recommendationSchema.methods.updateInteraction = async function (type) {
    this.lastInteraction = new Date();
    this.interactionType = type;
    await this.save();
};
// Add a static method to get top recommendations for a user
recommendationSchema.statics.getTopRecommendations = async function (userId, limit = 10) {
    return this.find({ userId, isActive: true })
        .sort({ score: -1 })
        .limit(limit)
        .populate('serviceId');
};
exports.Recommendation = mongoose_1.default.model('Recommendation', recommendationSchema);
