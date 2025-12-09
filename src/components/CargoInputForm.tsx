
'use client';

import { useState } from 'react';
import { TruckConfig, CargoItem, CargoType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PackagePlus, Box, AlertTriangle } from 'lucide-react';

interface CargoInputFormProps {
    onAdd: (items: CargoItem[]) => void;
    truckConfig: TruckConfig;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function CargoInputForm({ onAdd, truckConfig }: CargoInputFormProps) {
    const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

    // Custom Skid State
    const [customDims, setCustomDims] = useState({ length: 2, width: 2, height: 2 });
    const [error, setError] = useState<string | null>(null);

    // Quick Add Standard
    const handleAddStandard = (count: number) => {
        const newItems: CargoItem[] = Array.from({ length: count }).map(() => ({
            id: uuidv4(),
            type: 'standard',
            dimensions: { length: 1.2, width: 1.2, height: 1.2 }, // Assumed height 1.2m for standard pallet if not specified, usually pallets vary but footprint is 1.2x1.2
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
        onAdd(newItems);
    };

    const validateAndAddCustom = () => {
        setError(null);
        // Validation
        if (customDims.width > truckConfig.width) {
            setError(`Width (${customDims.width}m) exceeds truck width (${truckConfig.width}m)`);
            return;
        }
        if (customDims.height > truckConfig.height) {
            setError(`Height (${customDims.height}m) exceeds truck height (${truckConfig.height}m)`);
            return;
        }
        if (customDims.length > truckConfig.length) {
            setError(`Length (${customDims.length}m) exceeds truck length (${truckConfig.length}m)`);
            return;
        }

        // Add Item
        const newItem: CargoItem = {
            id: uuidv4(),
            type: 'custom',
            dimensions: { ...customDims },
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        onAdd([newItem]);
    };

    return (
        <div className="glass-card p-6 rounded-2xl w-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-400">
                    <PackagePlus className="w-5 h-5" />
                    <h2 className="text-lg font-semibold tracking-wide">Add Cargo</h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'standard' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'custom' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Custom Skid
                    </button>
                </div>
            </div>

            {activeTab === 'standard' && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleAddStandard(1)}
                        className="btn-secondary"
                    >
                        Add 1 Pallet
                    </button>
                    <button
                        onClick={() => handleAddStandard(5)}
                        className="btn-secondary"
                    >
                        Add 5 Pallets
                    </button>
                    <button
                        onClick={() => handleAddStandard(10)}
                        className="col-span-2 btn-primary"
                    >
                        Add 10 Pallets
                    </button>
                    <div className="col-span-2 text-center text-xs text-slate-500 mt-2">
                        Standard Size: 1.2m x 1.2m x 1.2m
                    </div>
                </div>
            )}

            {activeTab === 'custom' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                        {(['length', 'width', 'height'] as const).map(dim => (
                            <div key={dim} className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-400 uppercase font-bold">{dim}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={customDims[dim]}
                                    onChange={(e) => setCustomDims(prev => ({ ...prev, [dim]: parseFloat(e.target.value) || 0 }))}
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={validateAndAddCustom}
                        className="btn-primary"
                    >
                        Add Custom Skid
                    </button>
                </div>
            )}

            {/* Styles for buttons that share common look */}
            <style jsx>{`
        .btn-primary {
            @apply w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center;
        }
        .btn-secondary {
            @apply w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-medium py-3 rounded-xl border border-slate-600 transition-all active:scale-95;
        }
      `}</style>
        </div>
    );
}
