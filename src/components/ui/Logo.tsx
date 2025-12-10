'use client';

import { Cuboid } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    animated?: boolean;
}

const sizes = {
    sm: { icon: 16, text: 'text-lg', container: 32 },
    md: { icon: 20, text: 'text-xl', container: 40 },
    lg: { icon: 28, text: 'text-2xl', container: 56 },
};

export default function Logo({ size = 'md', showText = true, animated = true }: LogoProps) {
    const sizeConfig = sizes[size];

    const Wrapper = animated ? motion.div : 'div';
    const animationProps = animated ? {
        whileHover: { scale: 1.02 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
    } : {};

    return (
        <Wrapper
            className="flex items-center gap-3"
            {...animationProps}
        >
            {/* Icon container with DHL red gradient */}
            <div
                className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg"
                style={{ width: sizeConfig.container, height: sizeConfig.container }}
            >
                <Cuboid className="text-white" style={{ width: sizeConfig.icon, height: sizeConfig.icon }} />
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className={`font-bold ${sizeConfig.text} text-gray-800 tracking-tight leading-none`}>
                        EFFI
                    </span>
                    <span className="text-xs text-red-500 font-medium">
                        Load Optimizer
                    </span>
                </div>
            )}
        </Wrapper>
    );
}
