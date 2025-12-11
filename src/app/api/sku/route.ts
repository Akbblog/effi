import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sku from '@/models/Sku';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Only admin or approved users can upsert SKU
    // @ts-ignore
    if (session.user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const payload = await req.json();
    const { gtin, name, dimensions, weightKg, imageUrl, meta, barcodes } = payload;

    if (!gtin || !name || !dimensions) {
        return NextResponse.json({ message: 'Missing required fields (gtin, name, dimensions)' }, { status: 400 });
    }

    await dbConnect();

    // Merge barcodes into the document using $addToSet to avoid duplicates
    const updateOps: any = {
        $set: {
            name,
            dimensions,
            weightKg: weightKg || null,
            imageUrl: imageUrl || null,
            meta: meta || {}
        }
    };

    if (Array.isArray(barcodes) && barcodes.length > 0) {
        updateOps.$addToSet = { barcodes: { $each: barcodes.map((b: string) => String(b).trim()) } };
    }

    const sku = await Sku.findOneAndUpdate({ gtin }, updateOps, { upsert: true, new: true, setDefaultsOnInsert: true });

    return NextResponse.json({ ok: true, sku });
}
