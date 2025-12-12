
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

export async function POST(request: Request) {
    let code = '';
    let metadata: any = {};

    try {
        const body = await request.json();
        code = body.code;
        metadata = body.metadata || {};
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id;

    let responseData = null;
    let source = '';

    // 0. SKU DB Lookup SKIPPED as per user request ("no master sku")
    /*
    await dbConnect();
    // Logic removed...
    */

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

    // 3. Fallback: Parse dimensions from the barcode string (Regex Heuristic & Fixed Formats)
    if (!responseData) {
        // Strategy A: Regex for explicit dimensions (e.g. "50x50x50", "50-50-50")
        // Support separators: x, X, *, -, _, ,, space
        const dimRegex = /(\d+(?:\.\d+)?)\s*[xX*,\-_\s]\s*(\d+(?:\.\d+)?)\s*[xX*,\-_\s]\s*(\d+(?:\.\d+)?)/;
        const match = code.match(dimRegex);

        if (match) {
            let l = parseFloat(match[1]);
            let w = parseFloat(match[2]);
            let h = parseFloat(match[3]);

            // Heuristic for units:
            // If > 4, assume cm (divide by 100) or mm (divide by 1000)
            if (l > 4 || w > 4 || h > 4) {
                if (l > 100 || w > 100 || h > 100) {
                    l /= 1000; w /= 1000; h /= 1000; // mm
                } else {
                    l /= 100; w /= 100; h /= 100; // cm
                }
            }

            source = 'barcode_parsing_regex';
            responseData = {
                type: 'custom',
                dimensions: { length: l, width: w, height: h },
                weight: null,
                description: `Item ${match[0]}`,
                reference: code
            };
        }

        // Strategy B: Fixed Length Heuristic (17-char)
        // Format: [PREFIX:4][L:3][W:3][H:3][SEQ:...]
        if (!responseData && code.length >= 17) {
            const match17 = code.match(/^([A-Z0-9]{4})(\d{3})(\d{3})(\d{3})(\d+)/);
            if (match17) {
                const l_mm = parseInt(match17[2]);
                const w_mm = parseInt(match17[3]);
                const h_mm = parseInt(match17[4]);

                if (l_mm > 0 && w_mm > 0 && h_mm > 0) {
                    source = 'barcode_parsing_fixed_17';
                    responseData = {
                        type: 'custom',
                        dimensions: {
                            length: l_mm / 1000,
                            width: w_mm / 1000,
                            height: h_mm / 1000
                        },
                        weight: null,
                        description: `Item ${code.substring(0, 10)}...`,
                        reference: code
                    };
                }
            }
        }

        // Strategy C: Dynamic MS-prefix format (Variable Length)
        // Support both MS58161624002 (13 char) and MS57196953 (10 char)
        // Core Pattern: MS + L(2) + W(2) + H(2) + [Optional Data]
        if (!responseData && code.startsWith('MS') && code.length >= 8) {
            const matchMS = code.match(/^MS(\d{2})(\d{2})(\d{2})(\d+)?/);
            if (matchMS) {
                const l_cm = parseInt(matchMS[1]);
                const w_cm = parseInt(matchMS[2]);
                const h_cm = parseInt(matchMS[3]);

                // Try to extract weight from remainder? 
                let wt_kg = null;
                const remainder = matchMS[4];

                if (remainder) {
                    if (remainder.length === 2) {
                        wt_kg = parseInt(remainder);
                    } else if (remainder.length >= 4) {
                        // Take first 2 as weight
                        wt_kg = parseInt(remainder.substring(0, 2));
                    }
                }

                if (l_cm > 0 && w_cm > 0 && h_cm > 0) {
                    source = 'barcode_parsing_ms_dynamic';
                    responseData = {
                        type: 'custom',
                        dimensions: {
                            length: l_cm / 100,
                            width: w_cm / 100,
                            height: h_cm / 100
                        },
                        weight: wt_kg,
                        description: `Item ${code}`,
                        reference: code
                    };
                }
            }
        }
    }

    // 4. Fallback for Unknown Barcodes (Default Pallet)
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
                    metadata,
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
