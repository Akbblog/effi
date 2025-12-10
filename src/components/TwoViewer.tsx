'use client';

import { TruckConfig, PackedItem } from '@/lib/types';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface TwoViewerProps {
    truck: TruckConfig;
    packedItems: PackedItem[];
}

export default function TwoViewer({ truck, packedItems }: TwoViewerProps) {
    const [hoveredItem, setHoveredItem] = useState<PackedItem | null>(null);

    return (
        <div className="w-full h-full min-h-[400px] glass-card-static rounded-2xl overflow-hidden p-6 flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Side Profile View
                    </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                    {truck.length}m × {truck.height}m
                </div>
            </div>

            {/* Viewer Container */}
            <div className="flex-1 flex items-center justify-center relative">
                <div
                    className="relative border border-gray-200 bg-gray-50 rounded-lg"
                    style={{
                        aspectRatio: `${truck.length} / ${truck.height}`,
                        width: '90%',
                        maxHeight: '100%',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
                            `,
                            backgroundSize: `${100 / truck.length}% ${100 / truck.height}%`,
                        }}
                    />

                    {/* Dimension labels */}
                    <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gray-300" />
                            <span className="text-xs font-mono text-gray-500 bg-white/90 border border-gray-200 px-2 py-0.5 rounded">
                                Length: {truck.length}m
                            </span>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gray-300" />
                        </div>
                    </div>

                    <div className="absolute -left-8 top-0 bottom-0 flex items-center">
                        <span className="-rotate-90 text-xs font-mono text-gray-500 whitespace-nowrap bg-white/90 border border-gray-200 px-2 py-0.5 rounded">
                            Height: {truck.height}m
                        </span>
                    </div>

                    {/* Cargo items */}
                    {packedItems.map((item, idx) => {
                        // Project 3D pos to 2D (Side view: Z -> X, Y -> Y)
                        const left = (item.position.z / truck.length) * 100;
                        const bottom = (item.position.y / truck.height) * 100;
                        const width = (item.dimensions.length / truck.length) * 100;
                        const height = (item.dimensions.height / truck.height) * 100;


                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                className="absolute cursor-pointer transition-all duration-200"
                                style={{
                                    left: `${left}%`,
                                    bottom: `${bottom}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                    backgroundColor: item.color,
                                    opacity: hoveredItem?.id === item.id ? 1 : 0.85,
                                    border: hoveredItem?.id === item.id ? '2px solid white' : '1px solid rgba(0,0,0,0.3)',
                                    borderRadius: '2px',
                                    boxShadow: hoveredItem?.id === item.id
                                        ? '0 0 20px rgba(255,255,255,0.3)'
                                        : '0 2px 4px rgba(0,0,0,0.2)',
                                    zIndex: hoveredItem?.id === item.id ? 10 : 1,
                                    transform: hoveredItem?.id === item.id ? 'scale(1.02)' : 'scale(1)',
                                }}
                                onMouseEnter={() => setHoveredItem(item)}
                                onMouseLeave={() => setHoveredItem(null)}
                            />
                        );
                    })}

                    {/* Truck floor indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/30 via-amber-500/60 to-amber-500/30 rounded-b" />
                </div>
            </div>

            {/* Tooltip */}
            {hoveredItem && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg px-4 py-2 shadow-xl z-20"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-sm shadow-sm"
                            style={{ backgroundColor: hoveredItem.color }}
                        />
                        <div>
                            <div className="text-sm font-medium text-white">
                                {hoveredItem.name || (hoveredItem.type === 'standard' ? 'Standard Pallet' : 'Custom Skid')}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                                {hoveredItem.dimensions.length}m × {hoveredItem.dimensions.width}m × {hoveredItem.dimensions.height}m
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4">
                <div className="text-[10px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 border border-emerald-500/50 rounded-sm" />
                        <span>Truck Bay</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-sm" />
                        <span>Cargo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
