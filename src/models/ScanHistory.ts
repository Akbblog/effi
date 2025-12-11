
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
    // Resolved metadata and audit fields
    resolvedName: String,
    resolvedDimensions: {
        length: Number,
        width: Number,
        height: Number,
    },
    source: String, // sku_db | carrier_api | internal_qr | barcode_fallback
    raw: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ScanHistory || mongoose.model('ScanHistory', ScanHistorySchema);
