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
    onScan: (data: string, metadata?: any) => Promise<{ success: boolean; isDuplicate?: boolean; message?: string }>;
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
    const isProcessingRef = useRef(false); // Ref version of isProcessing for stable callbacks
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Debounce for scan callbacks
    const lastDecodeTimeRef = useRef<number>(0); // Track decode timing
    const processCodeRef = useRef<(code: string, metadata?: any) => void>(() => { }); // Stable ref to processCode

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
    const processCode = useCallback(async (rawCode: string, metadata: any = {}) => {
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
        isProcessingRef.current = true;
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
            const result = await onScan(rawCode, metadata);

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
                        isProcessingRef.current = false;
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
                        isProcessingRef.current = false;
                        setIsProcessing(false);
                        startScanner();
                    }
                }, 2500);
            }
        }
    }, [isCodeAlreadyScanned, onScan, onClose]);

    // Keep processCodeRef updated
    useEffect(() => {
        processCodeRef.current = processCode;
    }, [processCode]);

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

            const html5QrCode = new Html5Qrcode("reader", { verbose: false });
            html5QrCodeRef.current = html5QrCode;

            // Optimized config for faster, smoother scanning
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 30, // Higher FPS for smoother video
                    qrbox: { width: 250, height: 250 }, // Slightly smaller for faster processing
                    disableFlip: true, // Disable flip for performance
                    // @ts-ignore - Enable barcode support
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    },
                    // Reduced formats for faster detection
                    formatsToSupport: [
                        0,  // QR_CODE
                        4,  // CODE_128 (most common shipping barcode)
                        8,  // EAN_13
                    ]
                },
                (decodedText: string, decodedResult: any) => {
                    // Debounce: ignore rapid-fire decodes (within 300ms)
                    const now = Date.now();
                    if (now - lastDecodeTimeRef.current < 300) {
                        return;
                    }
                    lastDecodeTimeRef.current = now;

                    // Use refs to avoid stale closure issues
                    if (!mountedRef.current || isProcessingRef.current || hasProcessedRef.current || processingLockRef.current) {
                        return;
                    }

                    // Clear any pending debounce
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }

                    // Structure the rich metadata
                    // html5-qrcode returns result with Format, decodedText, and resultPoints
                    // Some browsers/devices provide result.bounds or result.box
                    const metadata = {
                        format: decodedResult?.result?.format?.formatName || 'UNKNOWN',
                        quality: decodedResult?.result?.format?.quality || null,
                        points: decodedResult?.resultPoints || [],
                        // Try to get bounds if available (experimental features)
                        bounds: decodedResult?.bounds || decodedResult?.box || null,
                        rawBytes: decodedResult?.result?.rawBytes || null,
                        timestamp: new Date().toISOString()
                    };

                    // Debounce the processing to avoid rapid state updates
                    debounceTimerRef.current = setTimeout(() => {
                        processCodeRef.current(decodedText, metadata);
                    }, 50); // Reduced to 50ms for faster response
                },
                () => { } // Ignore frame errors silently
            );

            if (mountedRef.current) {
                setIsScanning(true);
                setIsInitializing(false);
            }
        } catch (err: any) {
            console.error("Error starting scanner", err);
            if (mountedRef.current) {
                if (err?.message?.includes('Permission denied') || err?.name === 'NotAllowedError') {
                    setScanError("Camera permission denied. Please allow camera access.");
                } else if (err?.message?.includes('not found') || err?.name === 'NotFoundError') {
                    setScanError("No camera found.");
                } else if (err?.message?.includes('already in use') || err?.name === 'NotReadableError') {
                    setScanError("Camera is in use by another app.");
                } else {
                    setScanError("Could not start camera.");
                }
                setIsInitializing(false);
            }
        }
    }, []); // No dependencies - uses refs for everything

    const handleRetry = useCallback(() => {
        setScanError(null);
        hasProcessedRef.current = false;
        processingLockRef.current = false;
        isProcessingRef.current = false;
        lastCodeRef.current = null;
        lastDecodeTimeRef.current = 0;
        setScanResult(null);
        setIsProcessing(false);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        startScanner();
    }, [startScanner]);

    useEffect(() => {
        mountedRef.current = true;
        hasProcessedRef.current = false;
        processingLockRef.current = false;
        isProcessingRef.current = false;
        lastCodeRef.current = null;
        lastDecodeTimeRef.current = 0;

        // Wait for next frame to ensure DOM is ready, then start
        const frame = requestAnimationFrame(() => {
            if (mountedRef.current) {
                startScanner();
            }
        });

        return () => {
            mountedRef.current = false;
            cancelAnimationFrame(frame);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (html5QrCodeRef.current) {
                const instance = html5QrCodeRef.current;
                if (instance.isScanning) {
                    instance.stop().catch(() => { }); // Silently ignore cleanup errors
                }
                try {
                    instance.clear();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

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
            {/* Minimal Header - Just close button */}
            <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
                <div className="flex items-center justify-end p-4">
                    <motion.button
                        onClick={onClose}
                        className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
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

            {/* Initializing State - Minimal */}
            {isInitializing && !scanError && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}

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
                {isScanning && !scanError && !scanResult && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-64 h-64">
                            {/* Corner Brackets - Static CSS */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                            {/* Scanning Line - Pure CSS Animation */}
                            <div
                                className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                                style={{
                                    animation: 'scanline 2s ease-in-out infinite',
                                    boxShadow: '0 0 8px rgba(16,185,129,0.6)'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

        </motion.div>
    );
}
