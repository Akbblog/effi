
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    contactNumber: {
        type: String,
        required: [true, 'Please provide a contact number'],
        maxlength: [20, 'Contact number cannot be more than 20 characters'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    company: {
        type: String,
        maxlength: [100, 'Company name cannot be more than 100 characters'],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' // Default to pending for approval
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
