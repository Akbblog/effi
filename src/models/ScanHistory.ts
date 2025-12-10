
import mongoose from 'mongoose';

const ScanHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    barcode: {
        type: String,
        required: true,
    },
    result: {
        type: String, // 'success' | 'not_found' | 'error'
        required: true,
    },
    cargoName: {
        type: String, // Name of cargo if successfully added
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ScanHistory || mongoose.model('ScanHistory', ScanHistorySchema);
