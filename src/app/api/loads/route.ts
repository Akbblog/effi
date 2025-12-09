
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import SavedLoad from '@/models/SavedLoad';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    // @ts-ignore
    const loads = await SavedLoad.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(loads);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { name, truckConfig, cargoItems } = await req.json();

    if (!name || !truckConfig) {
        return NextResponse.json({ message: 'Missing data' }, { status: 400 });
    }

    await dbConnect();

    const newLoad = await SavedLoad.create({
        // @ts-ignore
        userId: session.user.id,
        name,
        truckConfig,
        cargoItems
    });

    return NextResponse.json(newLoad, { status: 201 });
}
