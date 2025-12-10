'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Check, X, ShieldAlert, Loader2, Phone, Mail, Building2, Clock, Users,
    UserCheck, UserX, ArrowLeft, Package, Scan, Activity, Search,
    ChevronDown, ChevronUp, Trash2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo from '@/components/ui/Logo';

interface UserData {
    _id: string;
    name: string;
    email: string;
    company: string;
    contactNumber?: string;
    status: 'pending' | 'approved' | 'rejected';
    role: string;
    createdAt: string;
    lastLogin?: string;
    loadsCount: number;
    scansCount: number;
}

interface Stats {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    totalLoads: number;
    totalScans: number;
    scansToday: number;
}

interface UserDetail {
    user: UserData;
    loads: any[];
    scans: any[];
}

// Helper to format time ago
function timeAgo(date: string | undefined): string {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            // @ts-ignore
            if (session.user.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchData();
            }
        }
    }, [status, session, router]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/activity');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setStats(data.stats);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (userId: string) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUser(data);
            }
        } finally {
            setLoadingDetail(false);
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
                fetchData();
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user and all their data?')) return;

        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedUser(null);
                fetchData();
            }
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.status === filter;
        const matchesSearch = search === '' ||
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.company?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center relative bg-gray-50">
                <AnimatedBackground variant="minimal" />

                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                        <Logo size="lg" animated={false} />
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        Loading Admin Panel...
                    </div>
                </div>
            </div>
        );
    }

    // @ts-ignore
    if (session?.user?.role !== 'admin') return null;

    return (
        <main className="min-h-screen text-gray-800 relative bg-gray-50">
            <AnimatedBackground variant="minimal" />

            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto mb-8"
                >
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </motion.button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <ShieldAlert className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                                    <p className="text-gray-500 text-xs">Manage users & monitor activity</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 text-sm font-medium">Admin Mode</span>
                        </div>
                    </div>
                </motion.header>

                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Stats Cards */}
                    {stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                        >
                            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
                            <StatCard icon={Clock} label="Pending" value={stats.pendingUsers} color="amber" />
                            <StatCard icon={UserCheck} label="Approved" value={stats.approvedUsers} color="green" />
                            <StatCard icon={Package} label="Total Loads" value={stats.totalLoads} color="purple" />
                            <StatCard icon={Scan} label="Total Scans" value={stats.totalScans} color="cyan" />
                            <StatCard icon={Activity} label="Scans Today" value={stats.scansToday} color="red" />
                        </motion.div>
                    )}

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                        {/* Users List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                        >
                            {/* Filters */}
                            <div className="p-4 border-b border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                                        <Users className="w-5 h-5 text-red-500" />
                                        All Users
                                    </h2>
                                    <span className="text-xs text-gray-500">{filteredUsers.length} users</span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or company..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        />
                                    </div>
                                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f
                                                    ? 'bg-white text-gray-800 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No users found</p>
                                    </div>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <motion.div
                                            key={user._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer ${selectedUser?.user._id === user._id ? 'bg-red-50' : ''
                                                }`}
                                            onClick={() => fetchUserDetail(user._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 text-gray-600 font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex flex-col items-end text-xs">
                                                    <span className="text-gray-500">{user.loadsCount} loads • {user.scansCount} scans</span>
                                                    <span className="text-gray-400">Last: {timeAgo(user.lastLogin)}</span>
                                                </div>
                                                <StatusBadge status={user.status} />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* User Detail Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                        >
                            {loadingDetail ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                                </div>
                            ) : selectedUser ? (
                                <div className="divide-y divide-gray-100">
                                    {/* User Header */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/20">
                                                    {selectedUser.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800">{selectedUser.user.name}</h3>
                                                    <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={selectedUser.user.status} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {selectedUser.user.company && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Building2 className="w-4 h-4" />
                                                    {selectedUser.user.company}
                                                </div>
                                            )}
                                            {selectedUser.user.contactNumber && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    {selectedUser.user.contactNumber}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                Joined {new Date(selectedUser.user.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Activity className="w-4 h-4" />
                                                Last: {timeAgo(selectedUser.user.lastLogin)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4">
                                            {selectedUser.user.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(selectedUser.user._id, 'approve')}
                                                        disabled={actionLoading === selectedUser.user._id}
                                                        className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(selectedUser.user._id, 'reject')}
                                                        disabled={actionLoading === selectedUser.user._id}
                                                        className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(selectedUser.user._id)}
                                                disabled={actionLoading === selectedUser.user._id}
                                                className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Saved Loads */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                                            <Package className="w-4 h-4 text-purple-500" />
                                            Saved Loads ({selectedUser.loads.length})
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedUser.loads.length === 0 ? (
                                                <p className="text-xs text-gray-400">No saved loads</p>
                                            ) : (
                                                selectedUser.loads.map((load) => (
                                                    <div key={load._id} className="p-2 bg-gray-50 rounded-lg text-xs">
                                                        <div className="font-medium text-gray-700">{load.name}</div>
                                                        <div className="text-gray-400">
                                                            {load.cargoItems?.length || 0} items • {timeAgo(load.createdAt)}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Scan History */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                                            <Scan className="w-4 h-4 text-cyan-500" />
                                            Recent Scans ({selectedUser.scans.length})
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedUser.scans.length === 0 ? (
                                                <p className="text-xs text-gray-400">No scan history</p>
                                            ) : (
                                                selectedUser.scans.map((scan) => (
                                                    <div key={scan._id} className="p-2 bg-gray-50 rounded-lg text-xs flex items-center justify-between">
                                                        <div>
                                                            <div className="font-mono text-gray-700">{scan.barcode}</div>
                                                            <div className="text-gray-400">{scan.cargoName || 'Unknown'}</div>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded text-xs ${scan.result === 'success' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {scan.result}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Select a user to view details</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-500 border-blue-200',
        amber: 'bg-amber-50 text-amber-500 border-amber-200',
        green: 'bg-green-50 text-green-500 border-green-200',
        purple: 'bg-purple-50 text-purple-500 border-purple-200',
        cyan: 'bg-cyan-50 text-cyan-500 border-cyan-200',
        red: 'bg-red-50 text-red-500 border-red-200',
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} border flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        approved: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
            {status}
        </span>
    );
}
