'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, AlertCircle, RefreshCw, CheckCircle2, Loader2, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Scan result types for different outcomes
type ScanResult =
    | { status: 'success'; code: string; message: string }
    | { status: 'duplicate'; code: string; message: string }
    | { status: 'error'; code: string; message: string }
    | { status: 'processing'; code: string };

interface QRScannerProps {
    onScan: (data: string) => Promise<{ success: boolean; isDuplicate?: boolean; message?: string }>;
    onClose: () => void;
    scannedCodes?: Set<string>; // Already scanned codes to prevent duplicates
}

export default function QRScanner({ onScan, onClose, scannedCodes = new Set() }: QRScannerProps) {
    const html5QrCodeRef = useRef<any>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const mountedRef = useRef(true);
    const hasProcessedRef = useRef(false); // Prevent multiple processing
    const lastCodeRef = useRef<string | null>(null);
    const processingLockRef = useRef(false); // Lock to prevent concurrent processing

    // Normalize barcode - strip whitespace and make uppercase for comparison
    const normalizeCode = (code: string): string => {
        return code.trim().toUpperCase().replace(/\s+/g, '');
    };

    // Check if code was already scanned in this session or previously
    const isCodeAlreadyScanned = useCallback((code: string): boolean => {
        const normalized = normalizeCode(code);
        return scannedCodes.has(normalized);
    }, [scannedCodes]);

    // Process the scanned code
    const processCode = useCallback(async (rawCode: string) => {
        // Prevent concurrent processing
        if (processingLockRef.current || hasProcessedRef.current) {
            return;
        }

        const normalizedCode = normalizeCode(rawCode);

        // Skip if same code as last processed
        if (lastCodeRef.current === normalizedCode) {
            return;
        }

        // Lock processing
        processingLockRef.current = true;
        lastCodeRef.current = normalizedCode;

        // Check for duplicates
        if (isCodeAlreadyScanned(normalizedCode)) {
            setScanResult({
                status: 'duplicate',
                code: rawCode,
                message: 'This item has already been scanned'
            });

            // Auto-close after showing duplicate message
            setTimeout(() => {
                if (mountedRef.current) {
                    processingLockRef.current = false;
                    lastCodeRef.current = null;
                    setScanResult(null);
                }
            }, 2000);
            return;
        }

        // Mark as processing
        hasProcessedRef.current = true;
        setIsProcessing(true);
        setScanResult({ status: 'processing', code: rawCode });

        try {
            // Stop the scanner immediately to prevent more scans
            if (html5QrCodeRef.current?.isScanning) {
                try {
                    await html5QrCodeRef.current.stop();
                    setIsScanning(false);
                } catch (e) {
                    console.warn("Error stopping scanner:", e);
                }
            }

            // Call the parent handler
            const result = await onScan(rawCode);

            if (!mountedRef.current) return;

            if (result.success) {
                setScanResult({
                    status: 'success',
                    code: rawCode,
                    message: result.message || 'Item added successfully'
                });

                // Auto-close after success feedback
                setTimeout(() => {
                    if (mountedRef.current) {
                        onClose();
                    }
                }, 1200);
            } else if (result.isDuplicate) {
                setScanResult({
                    status: 'duplicate',
                    code: rawCode,
                    message: result.message || 'This item has already been scanned'
                });

                // Auto-close after duplicate feedback
                setTimeout(() => {
                    if (mountedRef.current) {
                        onClose();
                    }
                }, 1500);
            } else {
                setScanResult({
                    status: 'error',
                    code: rawCode,
                    message: result.message || 'Failed to process item'
                });

                // Allow retry after error
                setTimeout(() => {
                    if (mountedRef.current) {
                        hasProcessedRef.current = false;
                        processingLockRef.current = false;
                        setScanResult(null);
                        setIsProcessing(false);
                        // Restart scanner for retry
                        startScanner();
                    }
                }, 2500);
            }
        } catch (err) {
            console.error("Error processing scan:", err);
            if (mountedRef.current) {
                setScanResult({
                    status: 'error',
                    code: rawCode,
                    message: 'System error processing scan'
                });

                // Allow retry after error
                setTimeout(() => {
                    if (mountedRef.current) {
                        hasProcessedRef.current = false;
                        processingLockRef.current = false;
                        setScanResult(null);
                        setIsProcessing(false);
                        startScanner();
                    }
                }, 2500);
            }
        }
    }, [isCodeAlreadyScanned, onScan, onClose]);

    const startScanner = useCallback(async () => {
        if (!mountedRef.current) return;

        setScanError(null);
        setIsInitializing(true);

        try {
            const readerElement = document.getElementById("reader");
            if (!readerElement) {
                if (mountedRef.current) {
                    setScanError("Scanner element not found. Please try again.");
                    setIsInitializing(false);
                }
                return;
            }

            // Dynamically import to avoid SSR issues
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
                    fps: 15, // Reduced FPS to prevent rapid-fire scans
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1,
                    // @ts-ignore - Enable barcode support
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    },
                    // Support multiple barcode formats for shipping labels
                    formatsToSupport: [
                        0,  // QR_CODE
                        4,  // CODE_128 (common shipping barcode)
                        2,  // CODE_39
                        8,  // EAN_13
                        11, // ITF
                        13, // UPC_A
                    ]
                },
                (decodedText: string) => {
                    if (!mountedRef.current || isProcessing || hasProcessedRef.current || processingLockRef.current) {
                        return;
                    }

                    // Process the code
                    processCode(decodedText);
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
                    setScanError("Camera permission denied. Please allow camera access in your browser settings.");
                } else if (err?.message?.includes('not found') || err?.name === 'NotFoundError') {
                    setScanError("No camera found. Please ensure a camera is connected.");
                } else if (err?.message?.includes('already in use') || err?.name === 'NotReadableError') {
                    setScanError("Camera is being used by another application. Please close other apps using the camera.");
                } else {
                    setScanError("Could not start camera. Please check permissions and try again.");
                }
                setIsInitializing(false);
            }
        }
    }, [isProcessing, processCode]);

    const handleRetry = useCallback(() => {
        setScanError(null);
        hasProcessedRef.current = false;
        processingLockRef.current = false;
        lastCodeRef.current = null;
        setScanResult(null);
        setIsProcessing(false);
        startScanner();
    }, [startScanner]);

    useEffect(() => {
        mountedRef.current = true;
        hasProcessedRef.current = false;
        processingLockRef.current = false;
        lastCodeRef.current = null;

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

    // Render scan result overlay
    const renderScanResult = () => {
        if (!scanResult) return null;

        const configs = {
            processing: {
                icon: <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />,
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-500/30',
                title: 'Processing...',
                subtitle: `Scanning: ${scanResult.code.substring(0, 20)}...`
            },
            success: {
                icon: <CheckCircle2 className="w-10 h-10 text-emerald-400" />,
                bgColor: 'bg-emerald-500/20',
                borderColor: 'border-emerald-500/30',
                title: 'Item Added!',
                subtitle: scanResult.status === 'success' ? scanResult.message : ''
            },
            duplicate: {
                icon: <Ban className="w-10 h-10 text-amber-400" />,
                bgColor: 'bg-amber-500/20',
                borderColor: 'border-amber-500/30',
                title: 'Duplicate Scan',
                subtitle: scanResult.status === 'duplicate' ? scanResult.message : ''
            },
            error: {
                icon: <AlertCircle className="w-10 h-10 text-red-400" />,
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/30',
                title: 'Scan Error',
                subtitle: scanResult.status === 'error' ? scanResult.message : ''
            }
        };

        const config = configs[scanResult.status];

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <div className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-8 text-center max-w-xs mx-4`}>
                    <div className="flex justify-center mb-4">
                        {config.icon}
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">{config.title}</h3>
                    <p className="text-white/70 text-sm">{config.subtitle}</p>

                    {scanResult.status === 'error' && (
                        <motion.button
                            onClick={handleRetry}
                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </motion.button>
                    )}
                </div>
            </motion.div>
        );
    };

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
                            <p className="text-xs text-white/60">
                                {isProcessing ? 'Processing...' : 'Point at barcode or QR'}
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Close Scanner"
                        disabled={isProcessing}
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Scan Result Overlay */}
            <AnimatePresence>
                {scanResult && renderScanResult()}
            </AnimatePresence>

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

            {/* Camera Error */}
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

            {/* Camera Viewport */}
            <div
                id="reader"
                className="w-full h-full flex-1 [&>video]:w-full [&>video]:h-full [&>video]:object-cover bg-black relative"
            >
                {/* Viewfinder Overlay */}
                {isScanning && !scanError && !scanResult && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-72 h-72">
                            {/* Corner Brackets */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-emerald-400 rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-emerald-400 rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-emerald-400 rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-emerald-400 rounded-br-xl" />

                            {/* Scanning Line */}
                            <motion.div
                                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                                initial={{ top: "10%" }}
                                animate={{ top: ["10%", "90%", "10%"] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Helper */}
            {isScanning && !scanError && !scanResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-safe"
                >
                    <div className="p-6 text-center">
                        <p className="text-white/80 text-sm font-medium">
                            Position barcode within the frame
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                            Supports QR codes, CODE128, CODE39 & EAN barcodes
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
