
'use client';

import { TruckConfig, PackedItem } from '@/lib/types';

interface TwoViewerProps {
    truck: TruckConfig;
    packedItems: PackedItem[];
}

export default function TwoViewer({ truck, packedItems }: TwoViewerProps) {
    // Side Profile: Length (Z) on X-axis, Height (Y) on Y-axis.
    // Items projected onto this plane.

    return (
        <div className="w-full h-full min-h-[400px] bg-slate-900/50 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm p-8 flex items-center justify-center relative">
            <div className="relative border-4 border-slate-600 bg-slate-800/30"
                style={{
                    aspectRatio: `${truck.length} / ${truck.height}`,
                    width: '90%',
                    height: 'auto',
                    maxHeight: '100%'
                }}>

                {/* Truck Dimensions Labels */}
                <div className="absolute -top-6 w-full text-center text-xs font-mono text-slate-400">Length: {truck.length}m</div>
                <div className="absolute -left-6 top-0 h-full flex items-center"><span className="-rotate-90 text-xs font-mono text-slate-400 whitespace-nowrap">Height: {truck.height}m</span></div>

                {packedItems.map(item => {
                    // Project 3D pos to 2D
                    // Z -> Left %
                    // Y -> Bottom %
                    const left = (item.position.z / truck.length) * 100;
                    const bottom = (item.position.y / truck.height) * 100;
                    const width = (item.dimensions.length / truck.length) * 100;
                    const height = (item.dimensions.height / truck.height) * 100;

                    // Opacity to handle depth overlap
                    return (
                        <div key={item.id}
                            className="absolute border border-black/30 hover:brightness-110 transition-all cursor-pointer"
                            style={{
                                left: `${left}%`,
                                bottom: `${bottom}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                                backgroundColor: item.color,
                                opacity: 0.8
                            }}
                            title={`Item: ${item.type}
Dims: ${item.dimensions.length}L x ${item.dimensions.width}W x ${item.dimensions.height}H
Pos: ${item.position.z}L, ${item.position.x}W, ${item.position.y}H`}
                        />
                    )
                })}
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-slate-500 font-mono">View: Side Profile (L x H)</div>
        </div>
    );
}
