import mongoose from 'mongoose';
import { IUser } from './User';

export interface IDonation extends mongoose.Document {
    userId: IUser['_id'];
    organizationId: IUser['_id'];
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    paymentMethod: 'STRIPE' | 'PAYPAL';
    paymentId: string;
    isRecurring: boolean;
    recurringInterval?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    description?: string;
    metadata?: Record<string, any>;
    refundReason?: string;
    createdAt: Date;
    updatedAt: Date;
    processRefund(reason: string): Promise<void>;
}

interface IDonationModel extends mongoose.Model<IDonation> {
    getOrganizationStats(organizationId: IUser['_id']): Promise<{
        totalAmount: number;
        averageDonation: number;
        totalDonors: number;
        recurringDonations: number;
    }[]>;
}

const donationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(orgId: mongoose.Types.ObjectId) {
                const org = await mongoose.model('User').findById(orgId);
                return org?.isNonProfit === true;
            },
            message: 'Organization must be a registered nonprofit'
        }
    },
    amount: {
        type: Number,
        required: true,
        min: [0.50, 'Donation amount must be at least 0.50'],
        validate: {
            validator: function(v: number) {
                // Ensure amount has at most 2 decimal places
                return Number(v.toFixed(2)) === v;
            },
            message: 'Amount cannot have more than 2 decimal places'
        }
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        uppercase: true,
        enum: ['USD'] // Can add more currencies in the future
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['STRIPE', 'PAYPAL']
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringInterval: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
        sparse: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    refundReason: {
        type: String,
        trim: true,
        maxlength: 500,
        sparse: true
    }
}, {
    timestamps: true
});

// Indexes for common queries
donationSchema.index({ userId: 1, createdAt: -1 }); // User's donation history
donationSchema.index({ organizationId: 1, createdAt: -1 }); // Organization's received donations
donationSchema.index({ status: 1, createdAt: -1 }); // Filter by status
donationSchema.index({ paymentId: 1 }, { unique: true }); // Quick payment lookups

// Method to process refund
donationSchema.methods.processRefund = async function(reason: string) {
    if (this.status !== 'COMPLETED') {
        throw new Error('Only completed donations can be refunded');
    }
    
    // In a real implementation, you would integrate with Stripe/PayPal here
    this.status = 'REFUNDED';
    this.refundReason = reason;
    await this.save();
};

// Static method to get donation statistics for an organization
donationSchema.statics.getOrganizationStats = async function(organizationId: IUser['_id']) {
    return this.aggregate([
        { $match: { organizationId, status: 'COMPLETED' } },
        { 
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                averageDonation: { $avg: '$amount' },
                totalDonors: { $addToSet: '$userId' },
                recurringDonations: { 
                    $sum: { $cond: ['$isRecurring', 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalAmount: 1,
                averageDonation: 1,
                totalDonors: { $size: '$totalDonors' },
                recurringDonations: 1
            }
        }
    ]);
};

// Pre-save hook to validate recurring donation fields
donationSchema.pre('save', function(next) {
    if (this.isRecurring && !this.recurringInterval) {
        next(new Error('Recurring interval is required for recurring donations'));
    }
    next();
});

export const Donation = mongoose.model<IDonation, IDonationModel>('Donation', donationSchema); 