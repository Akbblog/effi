'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { TruckConfig, CargoItem, PackedItem } from '@/lib/types';
import { packCargo } from '@/lib/algorithms/binPacking';
import TruckConfigForm from '@/components/TruckConfigForm';
import CargoInputForm from '@/components/CargoInputForm';
import ThreeViewer from '@/components/ThreeViewer';
import TwoViewer from '@/components/TwoViewer';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo from '@/components/ui/Logo';
import StatCard from '@/components/ui/StatCard';
import {
    Trash2, Save, History, Loader2, Play, LogOut,
    Gauge, Package, PackageX, Box, Shield, ChevronRight, X, QrCode, Plus
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
// Dynamically import jsPDF to avoid SSR issues
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    // Ref not needed for scanner anymore if we lift state, but keeping if needed for other things or removing if unused.
    // const cargoFormRef = useRef<CargoInputFormHandle>(null); 

    const [showScanner, setShowScanner] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);


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

    // Section Toggle State
    const [openSection, setOpenSection] = useState<'truck' | 'cargo' | null>(null);

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
                body: JSON.stringify({ name, truckConfig: truck, cargoItems })
            });
            if (res.ok) {
                // alert("Load saved successfully!"); // Removed alert to be cleaner or keep? User said "upon save it should generate pdf".
                // Better to show success then generate.
                // alert("Load saved!"); 
                fetchHistory();
                generatePDF(name); // Generate PDF
            } else {
                alert("Failed to save load. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const generatePDF = async (loadName: string) => {
        // Dynamically import to avoid "window is not defined" and other SSR errors
        const jsPDF = (await import('jspdf')).default;
        await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129); // Emerald-500
        doc.text("EFFI LOAD MANIFEST", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Load Name: ${loadName}`, 14, 30);
        doc.text(`Created: ${new Date().toLocaleString()}`, 14, 35);
        doc.text(`Truck Dimensions: ${truck.length}m x ${truck.width}m x ${truck.height}m`, 14, 40);
        doc.text(`Total Items: ${finalPackedItems.length} (${utilization}% Utilized)`, 14, 45);

        // Sort by Stop
        const sortedItems = [...finalPackedItems].sort((a, b) => (a.deliveryStop || 1) - (b.deliveryStop || 1));

        const tableBody = sortedItems.map((item, idx) => [
            (item.deliveryStop || 1).toString(),
            item.name || item.type || 'Unknown',
            `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`,
            `${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)}`,
            item.id.substring(0, 8)
        ]);

        // @ts-ignore
        doc.autoTable({
            startY: 55,
            head: [['Stop', 'Item Name', 'Dims (m)', 'Pos (x,y,z)', 'ID']],
            body: tableBody,
            headStyles: { fillColor: [6, 78, 59], textColor: 255 }, // Dark Green
            alternateRowStyles: { fillColor: [240, 253, 244] }, // Light Green
            styles: { fontSize: 9 },
        });

        doc.save(`Manifest_${loadName.replace(/\s+/g, '_')}.pdf`);
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

    // QR Scan Handler (Lifted from CargoInputForm)
    const handleScan = async (data: string) => {
        // setShowScanner(false); // REMOVED to keep scanner open


        const loadingToast = document.createElement('div');
        loadingToast.className = "fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium animate-in fade-in slide-in-from-top-4 border border-slate-700 flex items-center gap-2";
        loadingToast.innerHTML = `<span class="animate-spin">⏳</span> Processing Scan: ${data}...`;
        document.body.appendChild(loadingToast);

        try {
            const res = await fetch(`/api/integrations/lookup?code=${encodeURIComponent(data)}`);
            const json = await res.json();

            if (document.body.contains(loadingToast)) document.body.removeChild(loadingToast);

            const COLORS = [
                '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
                '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
            ];

            if (json.success && json.data) {
                const newItem: CargoItem = {
                    id: uuidv4(),
                    type: 'custom',
                    dimensions: json.data.dimensions,
                    color: json.source === 'carrier_api' ? '#3b82f6' : COLORS[Math.floor(Math.random() * COLORS.length)],
                    name: json.data.description || json.data.reference || `Consignment ${data}`,
                    deliveryStop: 1 // Default to 1 if scanned, or could prompt.
                };

                handleAddCargo([newItem]);
                // Success feedback
                setScanFeedback({ type: 'success', message: 'Item Added Successfully' });
                setTimeout(() => setScanFeedback(null), 2000);
            } else {
                // Error feedback (Toast instead of alert)
                setScanFeedback({ type: 'error', message: json.error || 'Invalid Scan' });
                setTimeout(() => setScanFeedback(null), 3000);
            }
        } catch (err) {
            if (document.body.contains(loadingToast)) document.body.removeChild(loadingToast);
            console.error(err);
            setScanFeedback({ type: 'error', message: 'System Error: Lookup failed' });
            setTimeout(() => setScanFeedback(null), 3000);
        }
    };


    const handleDownloadManifest = () => {
        if (packed.length === 0) {
            alert("No items packed to generate manifest.");
            return;
        }

        let content = `EFFI LOAD MANIFEST\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Truck: ${truck.length}x${truck.width}x${truck.height}m\n`;
        content += `Total Items: ${packed.length}\n\n`;

        content += `--------------------------------------------------------------------------------\n`;
        content += `STOP | ITEM TYPE           | DIMENSIONS (LxWxH)   | POSITION (x,y,z) | ID\n`;
        content += `--------------------------------------------------------------------------------\n`;

        // Sort by Stop (Ascending for driver list - first stop first)
        const sortedForManifest = [...finalPackedItems].sort((a, b) => (a.deliveryStop || 1) - (b.deliveryStop || 1));

        sortedForManifest.forEach(item => {
            const dims = `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`;
            const pos = `${item.position.x.toFixed(2)},${item.position.y.toFixed(2)},${item.position.z.toFixed(2)}`;
            const name = (item.name || item.type).padEnd(20).slice(0, 20);
            const stop = (item.deliveryStop || 1).toString().padStart(4);

            content += `${stop} | ${name} | ${dims.padEnd(20)} | ${pos.padEnd(16)} | ${item.id.slice(0, 8)}\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifest_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <main className="min-h-screen text-slate-100 relative">
            <AnimatedBackground variant="minimal" />

            {/* Global QR Scanner Overlay */}
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Scan Feedback Overlay */}
            <AnimatePresence>
                {scanFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 backdrop-blur-md ${scanFeedback.type === 'success'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                            }`}
                    >
                        <div className="bg-white/20 rounded-full p-1">
                            {scanFeedback.type === 'success' ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold">{scanFeedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center justify-between"
                >
                    <Logo size="md" />

                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-slate-200 font-medium text-sm">{session.user.name}</span>
                                <span className="text-xs text-slate-500">{session.user.email}</span>
                            </div>
                        )}

                        {/* @ts-ignore */}
                        {session?.user?.role === 'admin' && (
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
                            onClick={() => setShowScanner(true)}
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
                                onClick={handleDownloadManifest}
                                disabled={cargoItems.length === 0}
                                className="btn-secondary py-3 flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Box className="w-4 h-4 text-emerald-400" />
                                Manifest
                            </motion.button>
                            <motion.button
                                onClick={saveLoad}
                                disabled={saving || cargoItems.length === 0}
                                className="btn-primary py-3"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Load
                            </motion.button>
                        </div>

                        {/* Accordion: Truck Config */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                            <button
                                onClick={() => setOpenSection(openSection === 'truck' ? null : 'truck')}
                                className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition"
                            >
                                <span>Truck Configuration</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${openSection === 'truck' ? 'rotate-90' : ''}`} />
                            </button>
                            {openSection === 'truck' && (
                                <div className="p-4 border-t border-slate-800">
                                    <TruckConfigForm config={truck} onChange={setTruck} />
                                </div>
                            )}
                        </div>

                        {/* Accordion: Add Cargo */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                            <button
                                onClick={() => setOpenSection(openSection === 'cargo' ? null : 'cargo')}
                                className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition"
                            >
                                <span>Add Cargo (Manual)</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${openSection === 'cargo' ? 'rotate-90' : ''}`} />
                            </button>
                            {openSection === 'cargo' && (
                                <div className="p-4 border-t border-slate-800">
                                    <CargoInputForm onAdd={handleAddCargo} truckConfig={truck} />
                                </div>
                            )}
                        </div>


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

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
                                                    #{item.deliveryStop || 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-300 font-medium">
                                                        {item.name || (item.type === 'standard' ? 'Standard Pallet' : 'Custom Skid')}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px]">
                                                        {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height}m
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-sm shadow-sm"
                                                    style={{ backgroundColor: item.color }}
                                                />
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
