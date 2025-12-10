import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SavedLoad from '@/models/SavedLoad';
import ScanHistory from '@/models/ScanHistory';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // @ts-ignore
    if (session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get all users with activity stats
    const users = await User.find({}).select('-password').lean();

    // Get load counts per user
    const loadCounts = await SavedLoad.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    // Get scan counts per user
    const scanCounts = await ScanHistory.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    // Get total stats
    const totalLoads = await SavedLoad.countDocuments();
    const totalScans = await ScanHistory.countDocuments();

    // Today's scans
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await ScanHistory.countDocuments({ createdAt: { $gte: today } });

    // Merge user data with activity
    const usersWithActivity = users.map((user: any) => {
        const loadCount = loadCounts.find((l: any) => l._id === user._id.toString());
        const scanCount = scanCounts.find((s: any) => s._id === user._id.toString());

        return {
            ...user,
            _id: user._id.toString(),
            loadsCount: loadCount?.count || 0,
            scansCount: scanCount?.count || 0,
        };
    });

    return NextResponse.json({
        users: usersWithActivity,
        stats: {
            totalUsers: users.length,
            pendingUsers: users.filter((u: any) => u.status === 'pending').length,
            approvedUsers: users.filter((u: any) => u.status === 'approved').length,
            totalLoads,
            totalScans,
            scansToday,
        }
    });
}
