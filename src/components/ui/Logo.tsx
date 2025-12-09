'use client';

import { Cuboid } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    animated?: boolean;
}

const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-2xl' },
};

export default function Logo({ size = 'md', showText = true, animated = true }: LogoProps) {
    const sizeConfig = sizes[size];

    const IconWrapper = animated ? motion.div : 'div';
    const animationProps = animated ? {
        whileHover: { scale: 1.05, rotate: 5 },
        transition: { type: 'spring', stiffness: 400, damping: 10 }
    } : {};

    return (
        <div className="flex items-center gap-3">
            <IconWrapper
                className={`${sizeConfig.container} logo-container bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg`}
                {...animationProps}
            >
                <Cuboid className={`${sizeConfig.icon} text-white`} />
            </IconWrapper>

            {showText && (
                <div>
                    <h1 className={`${sizeConfig.text} font-bold tracking-tight text-white`}>
                        EFFI
                        <span className="text-emerald-400 text-[0.6em] font-medium uppercase tracking-wider ml-2">
                            Load Optimizer
                        </span>
                    </h1>
                </div>
            )}
        </div>
    );
}
