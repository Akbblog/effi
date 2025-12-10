'use client';

import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
    variant?: 'default' | 'auth' | 'minimal';
}

export default function AnimatedBackground({ variant = 'default' }: AnimatedBackgroundProps) {
    if (variant === 'minimal') {
        return (
            <div className="fixed inset-0 -z-10 bg-[#f7f7f7]" />
        );
    }

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f7f7f7]">
            {/* Base gradient - very subtle */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100" />

            {/* Subtle accent orb - top */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212, 5, 17, 0.03) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    top: '-20%',
                    left: '-10%',
                }}
                animate={{
                    x: [0, 30, 0],
                    y: [0, 20, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Subtle yellow orb - bottom */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(255, 204, 0, 0.04) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    bottom: '-15%',
                    right: '-10%',
                }}
                animate={{
                    x: [0, -20, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {variant === 'auth' && (
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212, 5, 17, 0.02) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        top: '40%',
                        right: '20%',
                    }}
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.6, 0.5],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </div>
    );
}
