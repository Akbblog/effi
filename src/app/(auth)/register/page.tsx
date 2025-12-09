'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, User, Building2, Mail, Phone, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo from '@/components/ui/Logo';

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

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative">
                <AnimatedBackground variant="auth" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card p-8 rounded-3xl text-center relative overflow-hidden">
                        {/* Success gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
                        >
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>

                        <p className="text-slate-400 mb-6 leading-relaxed">
                            Thank you, <span className="text-white font-medium">{formData.name}</span>.
                            <br /><br />
                            We have received your request. Our team will review your details and contact you via
                            <span className="text-emerald-400 font-medium"> email</span> or
                            <span className="text-emerald-400 font-medium"> phone</span> ({formData.contactNumber}) to activate your account.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                className="btn-secondary w-full py-3"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12 relative">
            <AnimatedBackground variant="auth" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                    {/* Decorative top gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

                    <div className="flex flex-col items-center mb-8">
                        <Logo size="lg" showText={false} />
                        <h1 className="text-2xl font-bold text-white mt-6">Create Account</h1>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            Join EFFI for your logistics needs
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="input-label">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input pl-11"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="input pl-11"
                                    placeholder="Acme Logistics Inc."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input pl-11"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Contact No *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="input pl-11"
                                        placeholder="+1 555-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input pl-11"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 text-base mt-2"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting Request...
                                </>
                            ) : (
                                <>
                                    Register Company
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer branding */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Powered by <span className="text-slate-500 font-medium">EFFI</span> • Logistics Intelligence
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
