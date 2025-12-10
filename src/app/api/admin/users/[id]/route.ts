import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SavedLoad from '@/models/SavedLoad';
import ScanHistory from '@/models/ScanHistory';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // @ts-ignore
    if (session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    await dbConnect();

    // Get user details
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get user's loads
    const loads = await SavedLoad.find({ userId }).sort({ createdAt: -1 }).lean();

    // Get user's scan history
    const scans = await ScanHistory.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({
        user: {
            ...user,
            _id: (user as any)._id.toString(),
        },
        loads: loads.map((l: any) => ({
            ...l,
            _id: l._id.toString(),
        })),
        scans: scans.map((s: any) => ({
            ...s,
            _id: s._id.toString(),
        })),
    });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // @ts-ignore
    if (session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    await dbConnect();

    // Delete user and their data
    await User.findByIdAndDelete(userId);
    await SavedLoad.deleteMany({ userId });
    await ScanHistory.deleteMany({ userId });

    return NextResponse.json({ message: 'User deleted successfully' });
}
