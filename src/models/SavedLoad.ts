
import mongoose from 'mongoose';

// Flexible schema to store the exact JSON state of a load
const SavedLoadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        color: String
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.SavedLoad || mongoose.model('SavedLoad', SavedLoadSchema);
