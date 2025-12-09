
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, X, ShieldAlert, Loader2, Phone } from 'lucide-react';

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

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            // @ts-ignore
            if (session.user.role !== 'admin') {
                router.push('/dashboard'); // Kick non-admins back to dashboard
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
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action })
        });
        if (res.ok) {
            fetchUsers(); // Refresh list
        }
    };

    if (status === 'loading' || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

    // @ts-ignore
    if (session?.user?.role !== 'admin') return null;

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <header className="max-w-4xl mx-auto mb-10 flex items-center gap-4">
                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Admin Controls</h1>
                    <p className="text-slate-400">Manage user access requests</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Pending Requests ({users.length})</h2>
                </div>

                {users.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">
                        No pending registration requests.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {users.map(user => (
                            <div key={user._id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition">
                                <div>
                                    <div className="font-bold text-slate-200 text-lg">{user.name}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-sm text-slate-400">{user.email}</div>
                                        {user.contactNumber && (
                                            <div className="flex items-center gap-1 text-sm text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                <Phone className="w-3 h-3" />
                                                {user.contactNumber}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-emerald-400 mt-2 uppercase tracking-wide font-medium">{user.company}</div>
                                    <div className="text-[10px] text-slate-600 mt-1">Requested: {new Date(user.createdAt).toLocaleString()}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleAction(user._id, 'reject')}
                                        className="btn-icon bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                        title="Reject"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(user._id, 'approve')}
                                        className="btn-icon bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                                        title="Approve"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .btn-icon {
                    @apply p-3 rounded-lg transition-all active:scale-95 flex items-center justify-center;
                }
            `}</style>
        </main>
    )
}
