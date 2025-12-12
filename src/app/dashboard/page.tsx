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
    // Candidate scanned item awaiting confirmation
    const [scanCandidate, setScanCandidate] = useState<null | {
        code: string;
        data: any;
        source: string;
    }>(null);
    const [saveSkuOnConfirm, setSaveSkuOnConfirm] = useState(true);
    const [modalName, setModalName] = useState('');
    const [modalDims, setModalDims] = useState<{ length: number; width: number; height: number }>({ length: 1.2, width: 1.2, height: 1.2 });
    // Save feedback state for SKU saving
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (scanCandidate) {
            setModalName(scanCandidate.data.description || scanCandidate.data.reference || `Item ${scanCandidate.code}`);
            setModalDims(scanCandidate.data.dimensions || { length: 1.2, width: 1.2, height: 1.2 });
            // reset save feedback when new candidate arrives
            setSaveStatus('idle');
            setSaveMessage('');
        }
    }, [scanCandidate]);

    // auto-clear success/error messages after a few seconds
    useEffect(() => {
        if (saveStatus === 'success' || saveStatus === 'error') {
            const t = setTimeout(() => {
                setSaveStatus('idle');
                setSaveMessage('');
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [saveStatus]);


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
    // Labeling controls for 3D viewer
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [labelMode, setLabelMode] = useState<'short' | 'detailed'>('short');

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
        doc.setTextColor(212, 5, 17); // DHL Red
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
            headStyles: { fillColor: [212, 5, 17], textColor: 255 }, // DHL Red
            alternateRowStyles: { fillColor: [255, 250, 240] }, // Light Warm/Amber
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
    const handleScan = async (data: string): Promise<{ success: boolean; isDuplicate?: boolean; message?: string }> => {
        try {
            const res = await fetch(`/api/integrations/lookup?code=${encodeURIComponent(data)}`);
            const json = await res.json();

            if (json.success && json.data) {
                // Keep candidate for operator confirmation before adding
                setScanCandidate({ code: data, data: json.data, source: json.source });
                // open scanner can remain open or close depending on UX; leave it open for now
                return { success: true, message: 'Scan received, awaiting confirmation' };
            } else {
                return { success: false, message: json.error || 'Invalid Scan' };
            }
        } catch (err) {
            console.error(err);
            return { success: false, message: 'System Error: Lookup failed' };
        }
    };

    // Confirm scan candidate: add to cargoItems and optionally save SKU
    const confirmScanCandidate = async (opts?: { saveSku?: boolean; name?: string; dimensions?: { length: number; width: number; height: number } }) => {
        if (!scanCandidate) return;
        const name = opts?.name ?? (scanCandidate.data.description || scanCandidate.data.reference || `Item ${scanCandidate.code}`);
        const dims = opts?.dimensions ?? scanCandidate.data.dimensions ?? { length: 1.2, width: 1.2, height: 1.2 };
        const weight = scanCandidate.data.weight ?? undefined; // Get weight from scan data

        const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

        const newItem: CargoItem = {
            id: uuidv4(),
            type: 'custom',
            dimensions: dims,
            color: scanCandidate.source === 'carrier_api' ? '#3b82f6' : COLORS[Math.floor(Math.random() * COLORS.length)],
            name,
            deliveryStop: 1,
            weight // Include weight for stacking rules
        };

        handleAddCargo([newItem]);

        // Optionally save to SKU DB (requires admin - server enforces)
        if (opts?.saveSku) {
            // Client-side check: only attempt save if current user is admin. Server also enforces admin.
            // @ts-ignore
            const isAdmin = session?.user?.role === 'admin';
            if (!isAdmin) {
                setSaveStatus('error');
                setSaveMessage('Only admins can save SKUs.');
            } else {
                setSaveStatus('saving');
                try {
                    const res = await fetch('/api/sku', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gtin: scanCandidate.code, name, dimensions: dims, barcodes: [scanCandidate.code] })
                    });
                    const json = await res.json().catch(() => null);
                    if (res.ok && json && json.ok) {
                        setSaveStatus('success');
                        setSaveMessage('SKU saved');
                    } else if (res.status === 403) {
                        setSaveStatus('error');
                        setSaveMessage('Forbidden: not an admin');
                    } else {
                        setSaveStatus('error');
                        setSaveMessage((json && json.message) || 'Failed to save SKU');
                    }
                } catch (e) {
                    console.error('Failed to save SKU', e);
                    setSaveStatus('error');
                    setSaveMessage('Network error saving SKU');
                }
            }
        }

        // Clear candidate
        setScanCandidate(null);
    };

    const cancelScanCandidate = () => setScanCandidate(null);


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
        <main className="min-h-screen text-gray-800 relative">
            <AnimatedBackground variant="minimal" />

            {/* Global QR Scanner Overlay */}
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Scan Confirmation Modal */}
            <AnimatePresence>
                {scanCandidate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/40" onClick={cancelScanCandidate} />

                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Confirm Scanned Item</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        {scanCandidate.code}
                                        <span className="text-gray-300">•</span>
                                        {scanCandidate.source.startsWith('barcode_parsing') ? (
                                            <span className="text-purple-600 font-medium flex items-center gap-1">
                                                ✨ Smart Scan
                                            </span>
                                        ) : scanCandidate.source === 'sku_db' ? (
                                            <span className="text-blue-600 font-medium flex items-center gap-1">
                                                💾 Master SKU
                                            </span>
                                        ) : scanCandidate.source === 'carrier_api' ? (
                                            <span className="text-green-600 font-medium flex items-center gap-1">
                                                🚚 Carrier API
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                {scanCandidate.source}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button onClick={cancelScanCandidate} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="mt-4 space-y-3">
                                <label className="block text-xs text-gray-600">Name</label>
                                <input value={modalName} onChange={(e) => setModalName(e.target.value)} className="w-full border rounded-md px-3 py-2" />

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-600">Length (m)</label>
                                        <input type="number" step="0.01" value={modalDims.length} onChange={(e) => setModalDims(d => ({ ...d, length: Number(e.target.value) }))} className="w-full border rounded-md px-2 py-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Width (m)</label>
                                        <input type="number" step="0.01" value={modalDims.width} onChange={(e) => setModalDims(d => ({ ...d, width: Number(e.target.value) }))} className="w-full border rounded-md px-2 py-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Height (m)</label>
                                        <input type="number" step="0.01" value={modalDims.height} onChange={(e) => setModalDims(d => ({ ...d, height: Number(e.target.value) }))} className="w-full border rounded-md px-2 py-1" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Disable the checkbox for non-admin users */}
                                    {/* @ts-ignore */}
                                    <input id="saveSku" type="checkbox" checked={saveSkuOnConfirm} onChange={(e) => setSaveSkuOnConfirm(e.target.checked)} disabled={session?.user?.role !== 'admin'} />
                                    <label htmlFor="saveSku" className="text-sm text-gray-700">Save this item to SKU master</label>
                                    { /* show a small helper when not admin */}
                                    { /* @ts-ignore */}
                                    {session?.user?.role !== 'admin' && (
                                        <span className="text-xs text-gray-400 italic ml-2">(Admin only)</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-3">
                                <button onClick={cancelScanCandidate} className="px-4 py-2 rounded-md border border-gray-200 text-sm">Cancel</button>
                                <button onClick={() => confirmScanCandidate({ saveSku: saveSkuOnConfirm, name: modalName, dimensions: modalDims })} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm">Confirm & Add</button>
                            </div>
                            {/* Save feedback */}
                            <div className="mt-3">
                                {saveStatus === 'saving' && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Saving SKU...</div>
                                )}
                                {saveStatus === 'success' && (
                                    <div className="text-sm text-green-600">{saveMessage || 'Saved'}</div>
                                )}
                                {saveStatus === 'error' && (
                                    <div className="text-sm text-red-600">{saveMessage || 'Save failed'}</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center justify-between bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
                >
                    <Logo size="md" />

                    <div className="flex items-center gap-3">
                        {session?.user && (
                            <div className="hidden md:flex items-center gap-3 pr-3 border-r border-gray-200">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                    {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-800 font-medium text-sm">{session.user.name}</span>
                                    <span className="text-xs text-gray-500">{session.user.email}</span>
                                </div>
                            </div>
                        )}

                        {/* @ts-ignore */}
                        {session?.user?.role === 'admin' && (
                            <motion.button
                                onClick={() => router.push('/admin')}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Shield className="w-3 h-3" />
                                Admin
                            </motion.button>
                        )}

                        <motion.button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium transition-colors"
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
                        {/* Primary Action - Scan Button */}
                        <motion.button
                            onClick={() => setShowScanner(true)}
                            className="w-full btn-action py-5 group"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <div className="text-left flex-1">
                                <span className="block font-semibold text-base">Scan Cargo</span>
                                <span className="text-xs text-white/70">QR codes & barcodes</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                        </motion.button>

                        {/* Actions Bar */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                onClick={handleDownloadManifest}
                                disabled={cargoItems.length === 0}
                                className="btn-secondary py-3.5 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                whileHover={{ scale: cargoItems.length > 0 ? 1.01 : 1 }}
                                whileTap={{ scale: cargoItems.length > 0 ? 0.99 : 1 }}
                            >
                                <Box className="w-4.5 h-4.5 text-red-500" />
                                <span className="font-medium">Manifest</span>
                            </motion.button>
                            <motion.button
                                onClick={saveLoad}
                                disabled={saving || cargoItems.length === 0}
                                className="btn-primary py-3.5 disabled:opacity-40"
                                whileHover={{ scale: !saving && cargoItems.length > 0 ? 1.01 : 1 }}
                                whileTap={{ scale: !saving && cargoItems.length > 0 ? 0.99 : 1 }}
                            >
                                {saving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                                <span className="font-medium">Save Load</span>
                            </motion.button>
                        </div>

                        {/* Accordion: Truck Config */}
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenSection(openSection === 'truck' ? null : 'truck')}
                                className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="icon-container w-8 h-8">
                                        <Gauge className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span>Truck Configuration</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all ${openSection === 'truck' ? 'rotate-90' : ''}`} />
                            </button>
                            {openSection === 'truck' && (
                                <div className="p-4 border-t border-gray-100">
                                    <TruckConfigForm config={truck} onChange={setTruck} />
                                </div>
                            )}
                        </div>

                        {/* Accordion: Add Cargo */}
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenSection(openSection === 'cargo' ? null : 'cargo')}
                                className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="icon-container w-8 h-8">
                                        <Plus className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span>Add Cargo (Manual)</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all ${openSection === 'cargo' ? 'rotate-90' : ''}`} />
                            </button>
                            {openSection === 'cargo' && (
                                <div className="p-4 border-t border-gray-100">
                                    <CargoInputForm onAdd={handleAddCargo} truckConfig={truck} />
                                </div>
                            )}
                        </div>


                        {/* Current Manifest */}
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-red-500" />
                                    Cargo Manifest
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
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
                                    <div className="text-center text-gray-400 text-sm py-8 italic flex flex-col items-center gap-2">
                                        <Box className="w-8 h-8 text-gray-300" />
                                        No cargo added yet
                                    </div>
                                ) : (
                                    cargoItems.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-gray-600 font-mono text-[10px] border border-gray-200">
                                                    #{item.deliveryStop || 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-700 font-medium">
                                                        {item.name || (item.type === 'standard' ? 'Standard Pallet' : 'Custom Skid')}
                                                    </span>
                                                    <span className="text-gray-400 text-[10px]">
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

                        {/* Viewer Container - Integrated Design */}
                        <div className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-0 aspect-auto sm:aspect-[3/4] md:aspect-[4/3] lg:aspect-auto lg:h-[560px] flex flex-col glass-card rounded-2xl overflow-hidden">
                            {/* Integrated Header with View Toggle */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                        {viewMode === '2d' ? 'Side Profile' : '3D Interactive'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Reset button (conditional) */}
                                    {Object.keys(manualOverrides).length > 0 && (
                                        <button
                                            onClick={handleResetEdits}
                                            className="text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                            title="Reset Manual Edits"
                                        >
                                            <X className="w-3 h-3" />
                                            Reset
                                        </button>
                                    )}

                                    {/* View Mode Toggle - Pill Style */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                        <button
                                            onClick={() => setViewMode('2d')}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === '2d'
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            2D
                                        </button>
                                        <button
                                            onClick={() => setViewMode('3d')}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === '3d'
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            3D
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Viewer Content */}
                            <div className="flex-1 relative">
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
                                                packedItems={finalPackedItems}
                                                onItemMove={handleItemMove}
                                                showLabels={false}
                                            />
                                        ) : (
                                            <TwoViewer truck={truck} packedItems={finalPackedItems} showLabels={false} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
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
