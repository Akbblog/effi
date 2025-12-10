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
        default: 'text-gray-800',
        highlight: 'text-red-600',
        error: 'text-red-500',
        warning: 'text-amber-600',
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
                            <span className="text-base font-medium text-gray-400 ml-1">
                                {suffix}
                            </span>
                        )}
                    </div>
                </div>

                {Icon && (
                    <div className={cn(
                        'p-2 rounded-lg',
                        variant === 'highlight' && 'bg-red-50 text-red-500',
                        variant === 'error' && 'bg-red-50 text-red-500',
                        variant === 'warning' && 'bg-amber-50 text-amber-500',
                        variant === 'default' && 'bg-gray-100 text-gray-500',
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
