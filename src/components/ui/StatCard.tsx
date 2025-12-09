'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'highlight' | 'error' | 'warning';
    suffix?: string;
    className?: string;
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
    suffix,
    className,
}: StatCardProps) {
    const variantColors = {
        default: 'text-white',
        highlight: 'text-emerald-400',
        error: 'text-red-400',
        warning: 'text-amber-400',
    };

    return (
        <div
            className={cn(
                'stat-card',
                variant === 'highlight' && 'highlight',
                variant === 'error' && 'error',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="stat-card-label">{label}</div>
                    <div className={cn('stat-card-value', variantColors[variant])}>
                        {value}
                        {suffix && (
                            <span className="text-base font-medium text-slate-400 ml-1">
                                {suffix}
                            </span>
                        )}
                    </div>
                </div>

                {Icon && (
                    <div className={cn(
                        'p-2 rounded-lg',
                        variant === 'highlight' && 'bg-emerald-500/10 text-emerald-400',
                        variant === 'error' && 'bg-red-500/10 text-red-400',
                        variant === 'warning' && 'bg-amber-500/10 text-amber-400',
                        variant === 'default' && 'bg-slate-700/50 text-slate-400',
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
