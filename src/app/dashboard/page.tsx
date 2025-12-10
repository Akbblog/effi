'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { TruckConfig, CargoItem, PackedItem } from '@/lib/types';
import { packCargo } from '@/lib/algorithms/binPacking';
import TruckConfigForm from '@/components/TruckConfigForm';
import CargoInputForm, { CargoInputFormHandle } from '@/components/CargoInputForm';
import ThreeViewer from '@/components/ThreeViewer';
import TwoViewer from '@/components/TwoViewer';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo from '@/components/ui/Logo';
import StatCard from '@/components/ui/StatCard';
import {
    Trash2, Save, History, Loader2, Play, LogOut,
    Gauge, Package, PackageX, Box, Shield, ChevronRight, X, QrCode
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const cargoFormRef = useRef<CargoInputFormHandle>(null);

    // Auth Check
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    // 1. Truck State
    const [truck, setTruck] = useState<TruckConfig>({
        length: 7.2,
        width: 2.4,
        height: 2.5,
    });

    // 2. Cargo State
    const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);

    // 3. View State
    const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');

    // 4. Algorithm Calculation
    const { packed, unpacked } = useMemo(() => {
        return packCargo(truck, cargoItems);
    }, [truck, cargoItems]);

    // Manual Editing State
    const [manualOverrides, setManualOverrides] = useState<Record<string, { x: number, y: number, z: number }>>({});

    const finalPackedItems = useMemo(() => {
        return packed.map(item => {
            if (manualOverrides[item.id]) {
                return { ...item, position: manualOverrides[item.id] };
            }
            return item;
        });
    }, [packed, manualOverrides]);

    const handleItemMove = (id: string, position: { x: number, y: number, z: number }) => {
        setManualOverrides(prev => ({
            ...prev,
            [id]: position
        }));
    };

    const handleResetEdits = () => {
        setManualOverrides({});
    };

    // 5. Saving / Loading State
    const [saving, setSaving] = useState(false);
    const [loadHistory, setLoadHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Statistics
    const totalVolume = truck.length * truck.width * truck.height;
    const packedVolume = packed.reduce((acc, item) => acc + (item.dimensions.length * item.dimensions.width * item.dimensions.height), 0);
    const utilization = ((packedVolume / totalVolume) * 100).toFixed(1);

    const handleAddCargo = (items: CargoItem[]) => {
        setCargoItems(prev => [...prev, ...items]);
        // Ideally we might want to keep overrides if id matches, but usually packing changes everything.
        // For now, let's reset overrides on new cargo add to prevent collisions
        setManualOverrides({});
    };

    const handleRemoveAll = () => {
        setCargoItems([]);
        setManualOverrides({});
    };

    const handleRemoveItem = (id: string) => {
        setCargoItems(prev => prev.filter(item => item.id !== id));
        const { [id]: deleted, ...rest } = manualOverrides;
        setManualOverrides(rest);
    };

    const saveLoad = async () => {
        const name = prompt("Enter a name for this load configuration:");
        if (!name) return;

        setSaving(true);
        try {
            const res = await fetch('/api/loads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Save the final state including manual overrides if we want persistence of edits
                // Current backend expects 'cargoItems' and 'truckConfig' and likely re-calculates or just stores.
                // To support saving POSITIONS, we would need to update the API to accept 'packedItems' directly.
                // IMPORTANT: The current MVP likely re-runs algo on load.
                // For now, we save standard inputs. 
                // TODO: Update backend to save manual positions if highly requested.
                body: JSON.stringify({ name, truckConfig: truck, cargoItems })
            });
            if (res.ok) {
                alert("Load saved successfully!");
                fetchHistory();
            } else {
                alert("Failed to save load.");
            }
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        const res = await fetch('/api/loads');
        if (res.ok) {
            const data = await res.json();
            setLoadHistory(data);
        }
    };

    const restoreLoad = (load: any) => {
        setTruck(load.truckConfig);
        setCargoItems(load.cargoItems);
        setShowHistory(false);
        setManualOverrides({});
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchHistory();
        }
    }, [status]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center relative">
                <AnimatedBackground variant="minimal" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-slate-400 text-sm">Loading workspace...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <main className="min-h-screen text-slate-100 relative">
            <AnimatedBackground variant="minimal" />

            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center justify-between"
                >
                    <Logo size="md" />

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-slate-200 font-medium text-sm">{session.user?.name}</span>
                            <span className="text-xs text-slate-500">{session.user?.email}</span>
                        </div>

                        {/* @ts-ignore */}
                        {session.user.role === 'admin' && (
                            <motion.button
                                onClick={() => router.push('/admin')}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Shield className="w-3 h-3" />
                                Admin
                            </motion.button>
                        )}

                        <motion.button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="btn-ghost text-slate-400"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </motion.button>
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 max-w-[1800px] mx-auto">

                    {/* LEFT COLUMN: Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-5"
                    >
                        {/* Primary Action */}
                        <motion.button
                            onClick={() => cargoFormRef.current?.openScanner()}
                            className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-3 transition-all group"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-semibold">Scan Cargo QR</span>
                                <span className="text-xs text-emerald-400/70">Tap to start camera</span>
                            </div>
                        </motion.button>

                        {/* Actions Bar */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                onClick={() => setShowHistory(!showHistory)}
                                className="btn-secondary py-3"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <History className="w-4 h-4 text-emerald-400" />
                                {showHistory ? 'Hide' : 'History'}
                            </motion.button>
                            <motion.button
                                onClick={saveLoad}
                                disabled={saving || cargoItems.length === 0}
                                className="btn-primary py-3"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save
                            </motion.button>
                        </div>

                        {/* History Panel */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="glass-gradient p-4 rounded-2xl max-h-[260px] overflow-y-auto">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <History className="w-3 h-3" />
                                            Saved Loads
                                        </h3>
                                        {loadHistory.length === 0 ? (
                                            <div className="text-center text-xs text-slate-600 italic py-6">
                                                No saved loads found.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {loadHistory.map((load: any) => (
                                                    <motion.div
                                                        key={load._id}
                                                        className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl hover:bg-slate-900/60 transition group cursor-pointer border border-transparent hover:border-emerald-500/20"
                                                        onClick={() => restoreLoad(load)}
                                                        whileHover={{ x: 2 }}
                                                    >
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-200">{load.name}</div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                                {new Date(load.createdAt).toLocaleDateString()} • {load.cargoItems.length} items
                                                            </div>
                                                        </div>
                                                        <Play className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <TruckConfigForm config={truck} onChange={setTruck} />
                        <CargoInputForm ref={cargoFormRef} onAdd={handleAddCargo} truckConfig={truck} />

                        {/* Current Manifest */}
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-400" />
                                    Cargo Manifest
                                    <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-400">
                                        {cargoItems.length}
                                    </span>
                                </h3>
                                {cargoItems.length > 0 && (
                                    <motion.button
                                        onClick={handleRemoveAll}
                                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear All
                                    </motion.button>
                                )}
                            </div>

                            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                                {cargoItems.length === 0 ? (
                                    <div className="text-center text-slate-600 text-sm py-8 italic flex flex-col items-center gap-2">
                                        <Box className="w-8 h-8 text-slate-700" />
                                        No cargo added yet
                                    </div>
                                ) : (
                                    cargoItems.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between text-xs bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-sm shadow-sm"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-slate-300">
                                                    {item.name || (item.type === 'standard' ? 'Standard Pallet' : 'Custom Skid')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-slate-500 text-[10px]">
                                                    {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}m
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}{/* End map */}
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Visualization */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-5"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard
                                label="Utilization"
                                value={utilization}
                                suffix="%"
                                icon={Gauge}
                                variant="highlight"
                            />
                            <StatCard
                                label="Packed Items"
                                value={packed.length}
                                icon={Package}
                            />
                            <StatCard
                                label="Unpacked"
                                value={unpacked.length}
                                icon={PackageX}
                                variant={unpacked.length > 0 ? 'error' : 'default'}
                            />
                            <StatCard
                                label="Available"
                                value={(totalVolume - packedVolume).toFixed(1)}
                                suffix="m³"
                                icon={Box}
                            />
                        </div>

                        {/* Viewer Container */}
                        <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[560px] flex flex-col">
                            {/* View Toggle */}
                            <div className="floating-panel top-4 right-4 p-1 flex gap-1">
                                {Object.keys(manualOverrides).length > 0 && (
                                    <button
                                        onClick={handleResetEdits}
                                        className="view-toggle-btn text-amber-400 hover:text-amber-300"
                                        title="Reset Manual Edits"
                                    >
                                        Reset
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewMode('2d')}
                                    className={`view-toggle-btn ${viewMode === '2d' ? 'active' : ''}`}
                                >
                                    2D Side
                                </button>
                                <button
                                    onClick={() => setViewMode('3d')}
                                    className={`view-toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
                                >
                                    3D View
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={viewMode}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full"
                                >
                                    {viewMode === '3d' ? (
                                        <ThreeViewer
                                            truck={truck}
                                            packedItems={finalPackedItems} // USE FINAL items
                                            onItemMove={handleItemMove}
                                        />
                                    ) : (
                                        <TwoViewer truck={truck} packedItems={finalPackedItems} />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Unpacked Warning */}
                        <AnimatePresence>
                            {unpacked.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                                >
                                    <div className="bg-red-500/10 p-2 rounded-lg">
                                        <PackageX className="text-red-400 w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-red-400 font-semibold text-sm">Items failed to pack</h4>
                                        <p className="text-red-400/70 text-xs mt-1">
                                            {unpacked.length} items could not fit in the current truck configuration.
                                            Try using smaller cargo or a larger truck.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
