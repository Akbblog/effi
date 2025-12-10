
import mongoose from 'mongoose';

// Flexible schema to store the exact JSON state of a load
const SavedLoadSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String for better compatibility
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    truckConfig: {
        length: Number,
        width: Number,
        height: Number
    },
    cargoItems: [{
        id: String,
        type: String,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        color: String,
        name: String,
        deliveryStop: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.SavedLoad || mongoose.model('SavedLoad', SavedLoadSchema);
