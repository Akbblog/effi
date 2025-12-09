'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, X, ShieldAlert, Loader2, Phone, Mail, Building2, Clock, Users, UserCheck, UserX, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import StatCard from '@/components/ui/StatCard';

interface UserRequest {
    _id: string;
    name: string;
    email: string;
    company: string;
    contactNumber?: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            // @ts-ignore
            if (session.user.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchUsers();
            }
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            });
            if (res.ok) {
                fetchUsers();
            }
        } finally {
            setActionLoading(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center relative">
                <AnimatedBackground variant="minimal" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-slate-400 text-sm">Loading admin panel...</p>
                </motion.div>
            </div>
        );
    }

    // @ts-ignore
    if (session?.user?.role !== 'admin') return null;

    return (
        <main className="min-h-screen text-slate-100 relative">
            <AnimatedBackground variant="minimal" />

            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </motion.button>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Admin Controls</h1>
                                    <p className="text-slate-400 text-sm">Manage user registrations & access</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 text-sm font-medium">Admin Mode</span>
                        </div>
                    </div>
                </motion.header>

                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <StatCard
                            label="Pending Requests"
                            value={users.length}
                            icon={Clock}
                            variant={users.length > 0 ? 'warning' : 'default'}
                        />
                        <StatCard
                            label="Action Required"
                            value={users.length > 0 ? 'Yes' : 'None'}
                            icon={Users}
                            variant={users.length > 0 ? 'highlight' : 'default'}
                        />
                        <StatCard
                            label="Admin Role"
                            value="Active"
                            icon={ShieldAlert}
                            variant="default"
                        />
                    </motion.div>

                    {/* Users List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-2xl overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                            <h2 className="font-semibold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" />
                                Pending Registrations
                                {users.length > 0 && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                                        {users.length} pending
                                    </span>
                                )}
                            </h2>
                        </div>

                        {users.length === 0 ? (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <UserCheck className="w-8 h-8 text-emerald-400" />
                                </motion.div>
                                <p className="text-slate-400 text-sm">All caught up!</p>
                                <p className="text-slate-600 text-xs mt-1">No pending registration requests.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/30">
                                <AnimatePresence>
                                    {users.map((user, idx) => (
                                        <motion.div
                                            key={user._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-5 flex items-center justify-between hover:bg-slate-800/20 transition group"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Avatar placeholder */}
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/50 text-slate-400 font-bold text-lg">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div>
                                                    <div className="font-semibold text-white text-lg">{user.name}</div>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {user.email}
                                                        </div>
                                                        {user.contactNumber && (
                                                            <div className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                                                                <Phone className="w-3 h-3" />
                                                                {user.contactNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {user.company && (
                                                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                                                            <Building2 className="w-3 h-3" />
                                                            {user.company}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Requested: {new Date(user.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={() => handleAction(user._id, 'reject')}
                                                    disabled={actionLoading === user._id}
                                                    className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    title="Reject"
                                                >
                                                    {actionLoading === user._id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <X className="w-5 h-5" />
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleAction(user._id, 'approve')}
                                                    disabled={actionLoading === user._id}
                                                    className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    title="Approve"
                                                >
                                                    {actionLoading === user._id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Check className="w-5 h-5" />
                                                    )}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
