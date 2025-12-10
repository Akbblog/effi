'use client';

import { useState, useEffect } from 'react';
import { TruckConfig, CargoItem, CargoType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PackagePlus, AlertTriangle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Removed dynamic QRScanner import

// Ref definition removed

interface CargoInputFormProps {
    onAdd: (items: CargoItem[]) => void;
    truckConfig: TruckConfig;
}

const COLORS = [
    '#fca5a5', '#fdba74', '#fcd34d', '#bef264', '#86efac',
    '#67e8f9', '#93c5fd', '#c4b5fd', '#f0abfc', '#fda4af'
];

const QUICK_ADD_OPTIONS = [
    { count: 1, label: 'Add 1', highlight: false },
    { count: 5, label: 'Add 5', highlight: false },
    { count: 10, label: 'Add 10', highlight: true },
];

// Transformed from forwardRef to standard component
export default function CargoInputForm({ onAdd, truckConfig }: CargoInputFormProps) {
    const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

    // Custom Skid State
    const [customDims, setCustomDims] = useState({ length: 2, width: 2, height: 2 });
    const [stdHeight, setStdHeight] = useState(1.2); // New state for variable height
    const [error, setError] = useState<string | null>(null);
    const [addedFeedback, setAddedFeedback] = useState<number | null>(null);
    // Removed showScanner state
    const [standardBase, setStandardBase] = useState(false);
    const [deliveryStop, setDeliveryStop] = useState(1);

    // Removed useImperativeHandle

    // Quick Add Standard
    const handleAddStandard = (count: number) => {
        setError(null);
        // Validate Height
        if (stdHeight <= 0) {
            setError("Height must be greater than 0");
            return;
        }
        if (stdHeight > truckConfig.height) {
            setError(`Height (${stdHeight}m) exceeds truck height (${truckConfig.height}m)`);
            return;
        }

        const newItems: CargoItem[] = Array.from({ length: count }).map(() => ({
            id: uuidv4(),
            type: 'standard',
            dimensions: { length: 1.2, width: 1.2, height: stdHeight },
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            name: 'Standard Pallet',
            deliveryStop: deliveryStop
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
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            name: standardBase ? 'Measured Skid' : 'Custom Skid',
            deliveryStop: deliveryStop
        };
        onAdd([newItem]);

        setAddedFeedback(1);
        setTimeout(() => setAddedFeedback(null), 1500);
    };

    // Removed handleScan

    // Auto-set 1.2x1.2 when standard base is checked
    useEffect(() => {
        if (standardBase) {
            setCustomDims(prev => ({ ...prev, length: 1.2, width: 1.2 }));
        }
    }, [standardBase]);

    return (
        <div className="glass-card p-5 rounded-2xl w-full relative overflow-hidden flex flex-col">
            <AnimatePresence>
                {addedFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-green-50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"
                            >
                                <Plus className="w-6 h-6 text-green-600" />
                            </motion.div>
                            <p className="text-green-600 font-medium">
                                Added {addedFeedback} {addedFeedback === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with Title and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                        <PackagePlus className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Manual & Scan</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
            </div>

            {/* Sequence Input (Global) */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Delivery Stop</span>
                    <span className="text-[10px] text-gray-400">For LIFO Sorting</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1">
                    <button onClick={() => setDeliveryStop(Math.max(1, deliveryStop - 1))} className="text-gray-400 hover:text-gray-700">-</button>
                    <span className="text-sm font-mono font-medium min-w-[20px] text-center text-red-500">{deliveryStop}</span>
                    <button onClick={() => setDeliveryStop(deliveryStop + 1)} className="text-gray-400 hover:text-gray-700">+</button>
                </div>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'standard' && (
                        <motion.div
                            key="standard"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Length</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value="1.2"
                                            disabled
                                            className="input text-center font-mono py-2.5 text-sm pr-7 bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed w-full"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">m</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Width</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value="1.2"
                                            disabled
                                            className="input text-center font-mono py-2.5 text-sm pr-7 bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed w-full"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">m</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-red-500 uppercase font-bold tracking-wider">Height</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min="0.1"
                                            value={stdHeight}
                                            onChange={(e) => setStdHeight(parseFloat(e.target.value) || 0)}
                                            className="input text-center font-mono py-2.5 text-sm pr-7 border-red-200 focus:ring-red-200 bg-red-50 w-full"
                                            placeholder="H"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">m</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && activeTab === 'standard' && (
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

                            <div className="space-y-2">
                                <motion.button
                                    onClick={() => handleAddStandard(1)}
                                    className="btn-primary w-full py-4 text-base shadow-lg shadow-emerald-500/20"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="mr-1">Add Standard Cargo</span>
                                </motion.button>

                                {/* Quick Multipliers */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[2, 3, 5, 10].map((count) => (
                                        <motion.button
                                            key={count}
                                            onClick={() => handleAddStandard(count)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-200 hover:border-gray-300"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            +{count}
                                        </motion.button>
                                    ))}
                                </div>
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
                            {/* Cubetape / Standard Base Toggle */}
                            <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="stdBase"
                                    checked={standardBase}
                                    onChange={(e) => setStandardBase(e.target.checked)}
                                    className="accent-emerald-500 w-4 h-4 rounded"
                                />
                                <label htmlFor="stdBase" className="text-xs text-emerald-400 font-medium cursor-pointer select-none">
                                    Standard Base (1.2m x 1.2m)
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Length</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min="0.1"
                                            value={customDims.length}
                                            disabled={standardBase}
                                            onChange={(e) => setCustomDims(p => ({ ...p, length: parseFloat(e.target.value) || 0 }))}
                                            className={`input text-center font-mono py-2.5 text-sm pr-7 ${standardBase ? 'bg-slate-800 text-slate-500' : ''} w-full`}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">m</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Width</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min="0.1"
                                            value={customDims.width}
                                            disabled={standardBase}
                                            onChange={(e) => setCustomDims(p => ({ ...p, width: parseFloat(e.target.value) || 0 }))}
                                            className={`input text-center font-mono py-2.5 text-sm pr-7 ${standardBase ? 'bg-slate-800 text-slate-500' : ''} w-full`}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">m</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider text-emerald-400">Height</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.1" min="0.1"
                                            value={customDims.height}
                                            autoFocus={standardBase}
                                            onChange={(e) => setCustomDims(p => ({ ...p, height: parseFloat(e.target.value) || 0 }))}
                                            className="input text-center font-mono py-2.5 text-sm pr-7 border-emerald-500/50 focus:ring-emerald-500/50 w-full"
                                            placeholder="Measure..."
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">m</span>
                                    </div>
                                </div>
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
                                Add {standardBase ? 'Measured Skid' : 'Custom Skid'}
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
        </div>
    );
}
