'use client';

import { useState } from 'react';
import { TruckConfig, CargoItem, CargoType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PackagePlus, Box, AlertTriangle, Plus, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CargoInputFormProps {
    onAdd: (items: CargoItem[]) => void;
    truckConfig: TruckConfig;
}

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
];

const QUICK_ADD_OPTIONS = [
    { count: 1, label: 'Add 1', highlight: false },
    { count: 5, label: 'Add 5', highlight: false },
    { count: 10, label: 'Add 10', highlight: true },
];

export default function CargoInputForm({ onAdd, truckConfig }: CargoInputFormProps) {
    const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

    // Custom Skid State
    const [customDims, setCustomDims] = useState({ length: 2, width: 2, height: 2 });
    const [error, setError] = useState<string | null>(null);
    const [addedFeedback, setAddedFeedback] = useState<number | null>(null);

    // Quick Add Standard
    const handleAddStandard = (count: number) => {
        const newItems: CargoItem[] = Array.from({ length: count }).map(() => ({
            id: uuidv4(),
            type: 'standard',
            dimensions: { length: 1.2, width: 1.2, height: 1.2 },
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
        onAdd(newItems);

        // Show feedback
        setAddedFeedback(count);
        setTimeout(() => setAddedFeedback(null), 1500);
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

        setAddedFeedback(1);
        setTimeout(() => setAddedFeedback(null), 1500);
    };

    return (
        <div className="glass-card p-5 rounded-2xl w-full relative overflow-hidden">
            {/* Success feedback overlay */}
            <AnimatePresence>
                {addedFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2"
                            >
                                <Plus className="w-6 h-6 text-emerald-400" />
                            </motion.div>
                            <p className="text-emerald-400 font-medium">
                                Added {addedFeedback} {addedFeedback === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                        <PackagePlus className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white">Add Cargo</h2>
                        <p className="text-xs text-slate-500">Add pallets or custom skids</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="view-toggle">
                    <button
                        onClick={() => { setActiveTab('standard'); setError(null); }}
                        className={`view-toggle-btn ${activeTab === 'standard' ? 'active' : ''}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => { setActiveTab('custom'); setError(null); }}
                        className={`view-toggle-btn ${activeTab === 'custom' ? 'active' : ''}`}
                    >
                        Custom
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'standard' && (
                    <motion.div
                        key="standard"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {QUICK_ADD_OPTIONS.map((option) => (
                                <motion.button
                                    key={option.count}
                                    onClick={() => handleAddStandard(option.count)}
                                    className={option.highlight ? 'btn-primary py-3' : 'btn-secondary py-3'}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Layers className="w-4 h-4" />
                                    {option.label}
                                </motion.button>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                            <Box className="w-3 h-3" />
                            Standard Pallet: 1.2m × 1.2m × 1.2m
                        </div>
                    </motion.div>
                )}

                {activeTab === 'custom' && (
                    <motion.div
                        key="custom"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-3 gap-3">
                            {(['length', 'width', 'height'] as const).map((dim) => (
                                <div key={dim} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        {dim}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            value={customDims[dim]}
                                            onChange={(e) => setCustomDims(prev => ({
                                                ...prev,
                                                [dim]: parseFloat(e.target.value) || 0
                                            }))}
                                            className="input text-center font-mono py-2.5 text-sm pr-7"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                                            m
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20"
                                >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={validateAndAddCustom}
                            className="btn-primary w-full py-3"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Custom Skid
                        </motion.button>

                        {/* Volume preview */}
                        <div className="text-center text-xs text-slate-500">
                            Volume: <span className="text-slate-400 font-mono">
                                {(customDims.length * customDims.width * customDims.height).toFixed(2)} m³
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
