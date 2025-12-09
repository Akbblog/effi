'use client';

import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
    variant?: 'default' | 'auth' | 'minimal';
}

export default function AnimatedBackground({ variant = 'default' }: AnimatedBackgroundProps) {
    if (variant === 'minimal') {
        return (
            <div className="fixed inset-0 -z-10 bg-animated" />
        );
    }

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#030712]">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-mesh" />

            {/* Floating orbs */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    top: '-20%',
                    left: '-10%',
                }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    bottom: '-15%',
                    right: '-10%',
                }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, -40, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {variant === 'auth' && (
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                        top: '40%',
                        right: '20%',
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                }}
            />
        </div>
    );
}
