
import { NextResponse } from 'next/server';

// Simulated database of external carrier consignments
// In a real production app, this would be validated against an external API (like Freight2020, SAP, etc.)
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

    // 1. Check Mock DB (The "Production" way to handle known external IDs)
    const carrierData = MOCK_CARRIER_DB[code];
    if (carrierData) {
        // Convert to our app's format
        // Assuming standard pallet base (1.2x1.2) for volume calculation if valid
        const item = carrierData.items[0];
        // h = vol / (1.2*1.2)
        const estimatedHeight = item.volume / (1.2 * 1.2);

        return NextResponse.json({
            success: true,
            source: 'carrier_api',
            data: {
                type: 'custom',
                dimensions: {
                    length: 1.2,
                    width: 1.2,
                    height: parseFloat(estimatedHeight.toFixed(2))
                },
                description: item.description
            }
        });
    }

    // 2. Parsable JSON (Internal QR codes)
    try {
        const parsed = JSON.parse(code);
        if (parsed.l && parsed.w && parsed.h) {
            return NextResponse.json({
                success: true,
                source: 'internal_qr',
                data: {
                    type: 'custom',
                    dimensions: {
                        length: Number(parsed.l),
                        width: Number(parsed.w),
                        height: Number(parsed.h)
                    }
                }
            });
        }
    } catch (e) {
        // Not JSON
    }

    // 3. Fallback for Unknown Barcodes / IDs
    // Instead of blocking, we let them succeed with a default "Standard Pallet" size
    // This allows testing with random barcodes (Coke can, book, etc.)
    return NextResponse.json({
        success: true,
        source: 'barcode_fallback',
        data: {
            type: 'standard',
            dimensions: {
                length: 1.2,
                width: 1.2,
                height: 1.2 // Default standard pallet height
            },
            description: `Item ${code}`, // Use the scanned code as the name
            reference: code
        }
    });

    // return NextResponse.json({ error: 'Unknown Consignment ID or Invalid Data' }, { status: 404 });
}
