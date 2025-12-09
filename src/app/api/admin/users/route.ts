
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';

// GET all pending users
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({ status: 'pending' }).sort({ createdAt: -1 }); // Get pending users
    return NextResponse.json(users);
}

// POST to approve/reject
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await req.json(); // action: 'approve' | 'reject'

    if (!userId || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    await dbConnect();

    if (action === 'reject') {
        await User.findByIdAndDelete(userId);
        return NextResponse.json({ message: 'User rejected and removed' });
    } else {
        await User.findByIdAndUpdate(userId, { status: 'approved' });
        return NextResponse.json({ message: 'User approved successfully' });
    }
}
