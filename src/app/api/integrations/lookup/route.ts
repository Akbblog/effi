
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import ScanHistory from '@/models/ScanHistory';
import Sku from '@/models/Sku';

// Simulated database of external carrier consignments
const MOCK_CARRIER_DB: Record<string, any> = {
    'MS57196953': {
        carrier: 'Northline',
        items: [
            {
                description: 'Ford Ranger Next Gen Parts',
                weight: 140, // kg
                volume: 0.43322, // m3
                qty: 1
            }
        ]
    }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id;

    let responseData = null;
    let source = '';

    // 0. Try SKU DB (GTIN/UPC/EAN) with normalization and alternate barcodes
    await dbConnect();
    // Build a set of candidate variants to increase match rate for common barcode formats
    const variants = new Set<string>();
    const raw = code.trim();
    variants.add(raw);
    variants.add(raw.toUpperCase());

    if (/^\d+$/.test(raw)) {
        // Numeric heuristics: UPC-A (12) -> EAN-13 (add leading 0), try padding to 14
        if (raw.length === 12) variants.add('0' + raw);
        if (raw.length === 13 && raw.startsWith('0')) variants.add(raw.slice(1));
        if (raw.length <= 13) variants.add(raw.padStart(14, '0'));
        // Remove leading zeros variant
        variants.add(raw.replace(/^0+/, '') || raw);
    }

    // Try also trimmed non-digit variant (remove spaces/dashes)
    variants.add(raw.replace(/[-\s]/g, ''));

    const variantArray = Array.from(variants).filter(Boolean);

    const sku = await Sku.findOne({
        $or: [
            { gtin: { $in: variantArray } },
            { barcodes: { $in: variantArray } },
            { 'meta.barcodes': { $in: variantArray } }
        ]
    }).lean();

    if (sku) {
        source = 'sku_db';
        responseData = {
            type: 'standard',
            dimensions: {
                length: sku.dimensions?.length || 1.0,
                width: sku.dimensions?.width || 1.0,
                height: sku.dimensions?.height || 1.0
            },
            weight: sku.weightKg || null, // Weight in kg from SKU DB
            description: sku.name,
            imageUrl: sku.imageUrl || null
        };
    }

    // 1. Check Mock DB (The "Production" way to handle known external IDs)
    const carrierData = MOCK_CARRIER_DB[code];
    if (!responseData && carrierData) {
        // Convert to our app's format
        const item = carrierData.items[0];
        // h = vol / (1.2*1.2)
        const estimatedHeight = item.volume / (1.2 * 1.2);

        source = 'carrier_api';
        responseData = {
            type: 'custom',
            dimensions: {
                length: 1.2,
                width: 1.2,
                height: parseFloat(estimatedHeight.toFixed(2))
            },
            weight: item.weight || null, // Weight from carrier
            description: item.description
        };
    }
    // 2. Parsable JSON (Internal QR codes)
    else {
        try {
            const parsed = JSON.parse(code);
            if (parsed.l && parsed.w && parsed.h) {
                source = 'internal_qr';
                responseData = {
                    type: 'custom',
                    dimensions: {
                        length: Number(parsed.l),
                        width: Number(parsed.w),
                        height: Number(parsed.h)
                    },
                    weight: parsed.wt ? Number(parsed.wt) : null // Weight from QR (optional)
                };
            }
        } catch (e) {
            // Not JSON, fall through
        }
    }

    // 3. Fallback for Unknown Barcodes / IDs
    if (!responseData) {
        source = 'barcode_fallback';
        responseData = {
            type: 'standard',
            dimensions: {
                length: 1.2,
                width: 1.2,
                height: 1.2 // Default standard pallet height
            },
            weight: null, // Unknown weight
            description: `Item ${code}`, // Use the scanned code as the name
            reference: code
        };
    }

    // Log to History if user is authenticated (include resolved metadata and raw payload)
    if (userId) {
        try {
            await ScanHistory.create({
                userId,
                barcode: code,
                result: 'success',
                cargoName: responseData.description || responseData.reference || 'Custom Item',
                dimensions: responseData.dimensions,
                resolvedName: responseData.description || null,
                resolvedDimensions: responseData.dimensions || null,
                source,
                raw: {
                    code,
                    parsed: (() => { try { return JSON.parse(code); } catch (e) { return null; } })()
                }
            });
        } catch (error) {
            console.error('Failed to log scan history:', error);
        }
    }

    return NextResponse.json({
        success: true,
        source,
        data: responseData
    });
}
