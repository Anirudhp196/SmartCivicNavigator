import mongoose from 'mongoose';
import { IUser } from './User';
import { IService } from './Service';

export interface IVolunteerSignup extends mongoose.Document {
    userId: IUser['_id'];
    serviceId: IService['_id'];
    eventId: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    startTime: Date;
    endTime: Date;
    role?: string;
    notes?: string;
    attendance?: {
        status: 'PRESENT' | 'ABSENT' | 'LATE';
        checkedInAt?: Date;
        checkedOutAt?: Date;
        notes?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const volunteerSignupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    eventId: { // This is the Google Calendar event ID
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING',
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        validate: {
            validator: function(startTime: Date) {
                return startTime > new Date();
            },
            message: 'Start time must be in the future'
        }
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function(this: any, endTime: Date) {
                return endTime > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    role: {
        type: String,
        trim: true,
        maxlength: 100
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    attendance: {
        status: {
            type: String,
            enum: ['PRESENT', 'ABSENT', 'LATE'],
            sparse: true
        },
        checkedInAt: Date,
        checkedOutAt: Date,
        notes: {
            type: String,
            trim: true,
            maxlength: 200
        }
    }
}, {
    timestamps: true
});

// Indexes for common queries
volunteerSignupSchema.index({ userId: 1, startTime: -1 }); // User's upcoming/past events
volunteerSignupSchema.index({ serviceId: 1, startTime: 1 }); // Service's volunteer schedule
volunteerSignupSchema.index({ status: 1, startTime: 1 }); // Filter by status and date
volunteerSignupSchema.index({ startTime: 1 }, { 
    expireAfterSeconds: 7776000 // 90 days after event
    // This TTL index will automatically remove old completed/cancelled events
});

// Compound unique index to prevent double booking
volunteerSignupSchema.index(
    { userId: 1, startTime: 1, endTime: 1 },
    { 
        unique: true,
        partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } }
    }
);

// Instance method to check in volunteer
volunteerSignupSchema.methods.checkIn = async function(notes?: string) {
    if (this.status !== 'CONFIRMED') {
        throw new Error('Can only check in confirmed volunteers');
    }

    const now = new Date();
    this.attendance = {
        status: now > this.startTime ? 'LATE' : 'PRESENT',
        checkedInAt: now,
        notes: notes
    };
    await this.save();
};

// Instance method to check out volunteer
volunteerSignupSchema.methods.checkOut = async function(notes?: string) {
    if (!this.attendance?.checkedInAt) {
        throw new Error('Volunteer must be checked in first');
    }

    this.attendance.checkedOutAt = new Date();
    if (notes) {
        this.attendance.notes = notes;
    }
    this.status = 'COMPLETED';
    await this.save();
};

// Static method to get upcoming events for a service
volunteerSignupSchema.statics.getUpcomingEvents = async function(serviceId: IService['_id']) {
    const now = new Date();
    return this.find({
        serviceId,
        startTime: { $gt: now },
        status: { $in: ['PENDING', 'CONFIRMED'] }
    })
    .sort({ startTime: 1 })
    .populate('userId', 'name email');
};

// Pre-save middleware to validate time conflicts
volunteerSignupSchema.pre('save', async function(next) {
    if (this.isModified('startTime') || this.isModified('endTime')) {
        const conflicts = await (this.constructor as typeof VolunteerSignup).findOne({
            userId: this.userId,
            _id: { $ne: this._id },
            status: { $in: ['PENDING', 'CONFIRMED'] },
            $or: [
                {
                    startTime: { $lt: this.endTime },
                    endTime: { $gt: this.startTime }
                }
            ]
        });

        if (conflicts) {
            next(new Error('Time slot conflicts with another volunteer commitment'));
        }
    }
    next();
});

export const VolunteerSignup = mongoose.model<IVolunteerSignup>('VolunteerSignup', volunteerSignupSchema); 