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
            <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-50">
                <AnimatedBackground variant="minimal" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl p-8 rounded-3xl text-center relative overflow-hidden">
                        {/* Success gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200"
                        >
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>

                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Thank you, <span className="text-gray-800 font-medium">{formData.name}</span>.
                            <br /><br />
                            We have received your request. Our team will review your details and contact you via
                            <span className="text-red-500 font-medium"> email</span> or
                            <span className="text-red-500 font-medium"> phone</span> ({formData.contactNumber}) to activate your account.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                className="w-full py-3 text-center font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors"
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
        <div className="min-h-screen flex items-center justify-center p-4 py-12 relative bg-gray-50">
            <AnimatedBackground variant="minimal" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl p-8 rounded-3xl relative overflow-hidden">
                    {/* Decorative top gradient line - DHL Red */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />

                    <div className="flex flex-col items-center mb-8">
                        <Logo size="lg" />
                        <h1 className="text-2xl font-bold text-gray-800 mt-6">Create Account</h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-red-500" />
                            Join EFFI for your logistics needs
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="Acme Logistics Inc."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact No *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                        placeholder="+1 555-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer branding */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Powered by <span className="text-gray-500 font-medium">AKB</span> • Logistics Intelligence
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
