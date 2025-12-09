
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cuboid, Loader2, CheckCircle, Phone } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        password: '',
        company: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setSuccess(true);
            // Don't auto-redirect, let them read the message

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
                <div className="w-full max-w-md bg-slate-800/50 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl glass-card text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>
                    <p className="text-slate-400 mb-6">
                        Thank you, <span className="text-slate-200 font-medium">{formData.name}</span>.
                        <br /><br />
                        We have received your request. Our team will review your details and contact you shortly via
                        <span className="text-emerald-400 font-medium"> email</span> or
                        <span className="text-emerald-400 font-medium"> phone</span> ({formData.contactNumber}) to activate your account.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href="/login" className="btn-secondary py-3 rounded-lg text-sm bg-slate-700/50 hover:bg-slate-700 transition text-slate-200">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-2xl glass-card">

                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                        <Cuboid className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 text-sm">Join EFFI for your logistics needs</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Company Name</label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="Acme Logistics Inc."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact No *</label>
                            <input
                                type="tel"
                                required
                                value={formData.contactNumber}
                                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Password *</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-900/30">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Submitting Request...' : 'Register Company'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Already have an account? {' '}
                    <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
