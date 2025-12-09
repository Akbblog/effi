
'use client';

import { useState, useMemo, useEffect } from 'react';
import { TruckConfig, CargoItem, PackedItem } from '@/lib/types';
import { packCargo } from '@/lib/algorithms/binPacking';
import TruckConfigForm from '@/components/TruckConfigForm';
import CargoInputForm from '@/components/CargoInputForm';
import ThreeViewer from '@/components/ThreeViewer';
import TwoViewer from '@/components/TwoViewer';
import { Cuboid, Trash2, ArrowRight, Save, History, Loader2, Play } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

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
    };

    const handleRemoveAll = () => {
        setCargoItems([]);
    };

    const saveLoad = async () => {
        const name = prompt("Enter a name for this load configuration:");
        if (!name) return;

        setSaving(true);
        try {
            const res = await fetch('/api/loads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, truckConfig: truck, cargoItems })
            });
            if (res.ok) {
                alert("Load saved successfully!");
                fetchHistory(); // Refresh
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
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchHistory();
        }
    }, [status]);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading workspace...</div>
    }

    if (!session) return null;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 p-4 md:p-8 font-sans">

            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Cuboid className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">EFFI <span className="text-emerald-500 text-sm font-normal uppercase tracking-wider ml-1">Load Optimizer</span></h1>
                        <p className="text-slate-400 text-xs">Maximize your logistics efficiency</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-slate-200 font-medium">{session.user?.name}</span>
                        <span className="text-xs text-emerald-400/80">{session.user?.email}</span>
                        {/* @ts-ignore */}
                        {session.user.role === 'admin' && (
                            <button onClick={() => router.push('/admin')} className="text-[10px] text-blue-400 hover:underline mt-1">
                                Go to Admin Panel
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 max-w-[1600px] mx-auto">

                {/* LEFT COLUMN: Controls */}
                <div className="space-y-6">

                    {/* Actions Bar */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 py-3 rounded-xl border border-slate-700 transition-all text-sm font-medium"
                        >
                            <History className="w-4 h-4 text-emerald-400" />
                            {showHistory ? 'Hide History' : 'Load History'}
                        </button>
                        <button
                            onClick={saveLoad}
                            disabled={saving || cargoItems.length === 0}
                            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Load
                        </button>
                    </div>

                    {/* History Popover (Inline) */}
                    {showHistory && (
                        <div className="glass-card p-4 rounded-xl border border-emerald-500/30 max-h-[300px] overflow-y-auto">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Saved Loads</h3>
                            {loadHistory.length === 0 ? (
                                <div className="text-center text-xs text-slate-600 italic py-4">No saved loads found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {loadHistory.map((load: any) => (
                                        <div key={load._id} className="flex items-center justify-between p-2 bg-slate-900/40 rounded-lg hover:bg-slate-900/60 transition group cursor-pointer" onClick={() => restoreLoad(load)}>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200">{load.name}</div>
                                                <div className="text-[10px] text-slate-500">{new Date(load.createdAt).toLocaleDateString()} • {load.cargoItems.length} items</div>
                                            </div>
                                            <Play className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <TruckConfigForm config={truck} onChange={setTruck} />
                    <CargoInputForm onAdd={handleAddCargo} truckConfig={truck} />

                    {/* Current Manifest */}
                    <div className="glass-card p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-300">Cargo Manifest ({cargoItems.length})</h3>
                            {cargoItems.length > 0 && (
                                <button onClick={handleRemoveAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </div>

                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                            {cargoItems.length === 0 ? (
                                <div className="text-center text-slate-600 text-sm py-8 italic">
                                    No cargo added yet.
                                </div>
                            ) : (
                                cargoItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-slate-300">{item.type === 'standard' ? 'Standard Pallet' : 'Custom Skid'}</span>
                                        </div>
                                        <span className="font-mono text-slate-500">
                                            {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Visualization */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Utilization" value={`${utilization}%`} highlight />
                        <StatCard label="Packed Items" value={packed.length.toString()} />
                        <StatCard label="Unpacked Items" value={unpacked.length.toString()} error={unpacked.length > 0} />
                        <StatCard label="Available Vol" value={`${(totalVolume - packedVolume).toFixed(1)} m³`} />
                    </div>

                    <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] flex flex-col">
                        <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur rounded-lg p-1 border border-slate-700 shadow-xl flex gap-1">
                            <button
                                onClick={() => setViewMode('2d')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === '2d' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
                            >
                                2D Side View
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === '3d' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
                            >
                                3D Interactive
                            </button>
                        </div>

                        {viewMode === '3d' ? (
                            <ThreeViewer truck={truck} packedItems={packed} />
                        ) : (
                            <TwoViewer truck={truck} packedItems={packed} />
                        )}
                    </div>

                    {unpacked.length > 0 && (
                        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <div className="bg-red-500/20 p-2 rounded-lg">
                                <ArrowRight className="text-red-500 w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-red-400 font-semibold text-sm">Items failed to pack</h4>
                                <p className="text-red-400/80 text-xs mt-1">
                                    {unpacked.length} items could not fit in the current truck configuration. Try rearranging priority or rotating items (auto-rotation coming soon).
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function StatCard({ label, value, highlight, error }: { label: string, value: string, highlight?: boolean, error?: boolean }) {
    return (
        <div className={`glass-card p-4 rounded-xl border-l-[4px] ${error ? 'border-red-500' : highlight ? 'border-emerald-500' : 'border-slate-600'}`}>
            <div className="text-slate-400 text-xs uppercase font-semibold">{label}</div>
            <div className={`text-2xl font-bold mt-1 ${error ? 'text-red-400' : highlight ? 'text-emerald-400' : 'text-white'}`}>
                {value}
            </div>
        </div>
    );
}
