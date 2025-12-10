'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, ScanLine, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const html5QrCodeRef = useRef<any>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const mountedRef = useRef(true);

    const startScanner = useCallback(async () => {
        if (!mountedRef.current) return;

        setScanError(null);
        setIsInitializing(true);

        try {
            // Check if element exists
            const readerElement = document.getElementById("reader");
            if (!readerElement) {
                if (mountedRef.current) {
                    setScanError("Scanner element not found. Please try again.");
                    setIsInitializing(false);
                }
                return;
            }

            // Dynamically import the library to avoid SSR issues
            const { Html5Qrcode } = await import('html5-qrcode');

            if (!mountedRef.current) return;

            // Clean up any existing instance
            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        await html5QrCodeRef.current.stop();
                    }
                    html5QrCodeRef.current.clear();
                } catch (e) {
                    console.warn("Cleanup warning:", e);
                }
            }

            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 25,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1,
                    // @ts-ignore
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                },
                (decodedText: string) => {
                    if (!mountedRef.current) return;

                    // Debounce scans
                    const now = Date.now();
                    // @ts-ignore
                    const lastTime = window.lastScanTime || 0;
                    // @ts-ignore
                    const lastCode = window.lastScanCode || null;

                    if (decodedText === lastCode && now - lastTime < 2000) return;
                    if (now - lastTime < 1000) return;

                    // @ts-ignore
                    window.lastScanTime = now;
                    // @ts-ignore
                    window.lastScanCode = decodedText;

                    onScan(decodedText);
                },
                () => { } // Ignore frame errors
            );

            if (mountedRef.current) {
                setIsScanning(true);
                setIsInitializing(false);
            }
        } catch (err: any) {
            console.error("Error starting scanner", err);
            if (mountedRef.current) {
                if (err?.message?.includes('Permission denied') || err?.name === 'NotAllowedError') {
                    setScanError("Camera permission denied. Please allow camera access and try again.");
                } else if (err?.message?.includes('not found') || err?.name === 'NotFoundError') {
                    setScanError("No camera found. Please ensure a camera is connected.");
                } else if (err?.message?.includes('already in use') || err?.name === 'NotReadableError') {
                    setScanError("Camera is being used by another application.");
                } else {
                    setScanError("Could not start camera. Please check permissions and try again.");
                }
                setIsInitializing(false);
            }
        }
    }, [onScan]);

    const handleRetry = useCallback(() => {
        setScanError(null);
        startScanner();
    }, [startScanner]);

    useEffect(() => {
        mountedRef.current = true;

        // Delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 150);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);

            if (html5QrCodeRef.current) {
                const instance = html5QrCodeRef.current;
                if (instance.isScanning) {
                    instance.stop().catch(console.error);
                }
                try {
                    instance.clear();
                } catch (e) {
                    console.warn("Clear warning:", e);
                }
            }
        };
    }, [startScanner]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* Header Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent pt-safe">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <ScanLine className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Scan Cargo</h2>
                            <p className="text-xs text-white/60">Point at QR code or barcode</p>
                        </div>
                    </div>

                    <motion.button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Close Scanner"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Initializing State */}
            <AnimatePresence>
                {isInitializing && !scanError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black"
                    >
                        <motion.div
                            className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="mt-4 text-white/70 text-sm">Starting camera...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {scanError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center z-10 px-6"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-xl px-6 py-8 rounded-2xl text-center max-w-sm border border-slate-700/50 shadow-2xl">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Camera Error</h3>
                            <p className="text-slate-400 text-sm mb-6">{scanError}</p>
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-medium transition-colors border border-slate-700"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Close
                                </motion.button>
                                <motion.button
                                    onClick={handleRetry}
                                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Camera Viewport - Full Screen */}
            <div
                id="reader"
                className="w-full h-full flex-1 [&>video]:w-full [&>video]:h-full [&>video]:object-cover bg-black relative"
            >
                {/* Viewfinder Overlay */}
                {isScanning && !scanError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Corner Brackets */}
                        <div className="relative w-64 h-64">
                            {/* Top Left */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                            {/* Top Right */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                            {/* Bottom Left */}
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                            {/* Bottom Right */}
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                            {/* Scanning Line Animation */}
                            <motion.div
                                className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                                initial={{ top: "10%" }}
                                animate={{ top: ["10%", "90%", "10%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Helper Text */}
            {isScanning && !scanError && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-safe"
                >
                    <div className="p-6 text-center">
                        <p className="text-white/80 text-sm">
                            Position the code within the frame
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                            Supports QR codes, barcodes & shipping labels
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
