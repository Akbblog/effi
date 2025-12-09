
'use client';

import { TruckConfig } from '@/lib/types';
import { Settings } from 'lucide-react';

interface TruckConfigFormProps {
    config: TruckConfig;
    onChange: (newConfig: TruckConfig) => void;
}

export default function TruckConfigForm({ config, onChange }: TruckConfigFormProps) {
    const handleChange = (key: keyof TruckConfig, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            onChange({ ...config, [key]: numValue });
        }
    };

    return (
        <div className="glass-card p-6 rounded-2xl w-full">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold tracking-wide">Truck Config</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {['Length', 'Width', 'Height'].map((dim) => {
                    const key = dim.toLowerCase() as keyof TruckConfig;
                    return (
                        <div key={dim} className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">
                                {dim} (m)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={config[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-lg"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
