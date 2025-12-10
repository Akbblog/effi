'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            false
        );

        scanner.render(
            (decodedText) => {
                // Success
                scanner.clear();
                onScan(decodedText);
            },
            (errorMessage) => {
                // Error (ignore mostly, as it throws on every frame no code is found)
                // console.log(errorMessage);
            }
        );

        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-slate-200 font-semibold">Scan QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-4 bg-black">
                    <div id="reader" className="w-full"></div>
                </div>

                <div className="p-4 text-center text-xs text-slate-500">
                    Point camera at a QR code to automatically add cargo.
                </div>
            </div>
        </div>
    );
}
