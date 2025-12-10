'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Check if element exists
                if (!document.getElementById("reader")) return;

                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: window.innerWidth / window.innerHeight,
                        // @ts-ignore
                        formatsToSupport: [
                            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 // Check library constants for specific enums if needed, or rely on auto-detection which is default. 
                            // Actually, Html5Qrcode "scan-type" defaults to all if not specified.
                            // But usually it prioritizes QR. Let's explicitly NOT limit it if it was limited, or leave it.
                            // However, the issue might be aspect ratio or focus. 
                            // Let's rely on default auto-detection but make sure the box is big enough.
                        ]
                    },
                    (decodedText) => {
                        // Debounce scans (2 second cooldown for same code, 0.5s for different)
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
                    (val) => { } // Ignore frame errors
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                setScanError("Camera access failed. Check permissions.");
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().catch(console.error);
                }
                html5QrCodeRef.current.clear();
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Close Scanner"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Error Message */}
            {scanError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-black/80 px-6 py-4 rounded-xl text-red-400 text-center pointer-events-auto border border-red-500/20">
                        <p className="mb-4">{scanError}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded text-white text-sm hover:bg-white/20">Close</button>
                    </div>
                </div>
            )}

            {/* Camera Viewport - Full Screen */}
            <div id="reader" className="w-full h-full flex-1 [&>video]:w-full [&>video]:h-full [&>video]:object-cover bg-black relative">
                {/* Optional: Minimal viewfinder hint if needed, purely visual */}
                {!scanError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                        <div className="w-64 h-64 border border-white/50 rounded-lg"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
