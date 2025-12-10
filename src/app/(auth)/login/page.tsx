'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An error occurred during sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-50">
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
                        <h1 className="text-2xl font-bold text-gray-800 mt-6">Welcome Back</h1>
                        <p className="text-gray-500 text-sm mt-1">Sign in to your workspace</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
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
                            className="w-full py-3.5 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                                Register Company
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
