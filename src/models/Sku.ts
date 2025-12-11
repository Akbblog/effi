import mongoose from 'mongoose';

const SkuSchema = new mongoose.Schema({
    gtin: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Alternate barcodes / internal SKU codes (e.g. Code128 IDs)
    barcodes: {
        type: [String],
        default: []
    },
    name: {
        type: String
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    weightKg: Number,
    imageUrl: String,
    meta: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Sku || mongoose.model('Sku', SkuSchema);
