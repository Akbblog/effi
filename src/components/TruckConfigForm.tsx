'use client';

import { TruckConfig } from '@/lib/types';
import { Truck, Ruler, ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TruckConfigFormProps {
    config: TruckConfig;
    onChange: (newConfig: TruckConfig) => void;
}

const dimensionConfig = [
    { key: 'length', label: 'Length', icon: Ruler, description: 'Cargo bay depth' },
    { key: 'width', label: 'Width', icon: ArrowLeftRight, description: 'Side to side' },
    { key: 'height', label: 'Height', icon: ArrowUpDown, description: 'Floor to ceiling' },
] as const;

export default function TruckConfigForm({ config, onChange }: TruckConfigFormProps) {
    const handleChange = (key: keyof TruckConfig, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            onChange({ ...config, [key]: numValue });
        }
    };

    return (
        <div className="glass-card p-5 rounded-2xl w-full">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                    <Truck className="w-4 h-4 text-red-500" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-gray-800">Set cargo bay dimensions</h2>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {dimensionConfig.map((dim, idx) => {
                    const Icon = dim.icon;
                    return (
                        <motion.div
                            key={dim.key}
                            className="flex flex-col gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <Icon className="w-3 h-3" />
                                {dim.label}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={config[dim.key]}
                                    onChange={(e) => handleChange(dim.key, e.target.value)}
                                    className="input text-center font-mono text-lg py-3 pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                                    m
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick volume indicator */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Volume</span>
                <span className="text-sm font-semibold text-red-500 font-mono">
                    {(config.length * config.width * config.height).toFixed(1)} m³
                </span>
            </div>
        </div>
    );
}
