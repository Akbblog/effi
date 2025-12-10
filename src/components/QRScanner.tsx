'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Initialize
                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                // Start scanning
                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        // Success
                        if (html5QrCodeRef.current) {
                            html5QrCodeRef.current.stop().then(() => {
                                onScan(decodedText);
                            }).catch(err => console.error("Failed to stop", err));
                        }
                    },
                    (errorMessage) => {
                        // Ignore frame errors
                    }
                );
                setIsScanning(true);
            } catch (err) {
                console.error("Error starting scanner", err);
                setScanError("Failed to access camera. Please ensure permissions are granted.");
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop on cleanup", err));
                html5QrCodeRef.current.clear();
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className="w-full max-w-md h-full max-h-[80vh] flex flex-col relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        Scan Cargo QR
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/50 hover:bg-slate-800/80 rounded-full text-white backdrop-blur-md transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner Viewport */}
                <div className="flex-1 relative flex items-center justify-center bg-slate-900">
                    {!isScanning && !scanError && (
                        <div className="text-slate-400 flex flex-col items-center gap-3 animate-pulse">
                            <RefreshCw className="w-8 h-8 animate-spin" />
                            <span className="text-sm">Starting Camera...</span>
                        </div>
                    )}

                    {scanError && (
                        <div className="text-red-400 flex flex-col items-center gap-2 px-8 text-center">
                            <span className="text-lg">📷 🚫</span>
                            <span className="text-sm">{scanError}</span>
                            <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white text-xs">Close</button>
                        </div>
                    )}

                    <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

                    {/* Overlay Guide */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-emerald-500/50 rounded-2xl relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-sm"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer status */}
                <div className="p-6 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800">
                    Align the QR code within the frame
                </div>
            </div>
        </div>
    );
}
