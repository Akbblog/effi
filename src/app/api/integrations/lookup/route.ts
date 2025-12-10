
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import ScanHistory from '@/models/ScanHistory';

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

    // 1. Check Mock DB (The "Production" way to handle known external IDs)
    const carrierData = MOCK_CARRIER_DB[code];
    if (carrierData) {
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
                    }
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
            description: `Item ${code}`, // Use the scanned code as the name
            reference: code
        };
    }

    // Log to History if user is authenticated
    if (userId) {
        try {
            await dbConnect();
            await ScanHistory.create({
                userId,
                barcode: code,
                result: 'success',
                cargoName: responseData.description || responseData.reference || 'Custom Item',
                dimensions: responseData.dimensions
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
