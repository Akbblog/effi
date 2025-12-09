'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'static' | 'gradient';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const variantStyles = {
    default: 'glass-card',
    static: 'glass-card-static',
    gradient: 'glass-gradient',
};

export default function GlassCard({
    children,
    className,
    variant = 'default',
    padding = 'md',
    hover = true,
}: GlassCardProps) {
    return (
        <div
            className={cn(
                variantStyles[variant],
                paddingStyles[padding],
                'rounded-2xl',
                !hover && 'hover:transform-none hover:shadow-none',
                className
            )}
        >
            {children}
        </div>
    );
}
