'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Edges, Environment, ContactShadows } from '@react-three/drei';
import { TruckConfig, PackedItem } from '@/lib/types';
import { useMemo, Suspense } from 'react';
import { Loader2, Maximize2, RotateCcw } from 'lucide-react';

interface ThreeViewerProps {
    truck: TruckConfig;
    packedItems: PackedItem[];
}

function LoadingFallback() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-xs text-slate-400">Loading 3D View...</p>
            </div>
        </div>
    );
}

export default function ThreeViewer({ truck, packedItems }: ThreeViewerProps) {
    // Center camera based on truck size
    const center = useMemo(() => [truck.width / 2, truck.height / 2, truck.length / 2], [truck]);
    const maxDim = Math.max(truck.width, truck.height, truck.length);

    return (
        <div className="w-full h-full min-h-[400px] relative group">
            {/* Glass container */}
            <div className="absolute inset-0 glass-card-static rounded-2xl overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                    <Canvas shadows>
                        <PerspectiveCamera makeDefault position={[maxDim * 1.5, maxDim * 1.2, maxDim * 1.8]} />
                        <OrbitControls
                            target={[center[0], center[1], center[2]] as [number, number, number]}
                            enableDamping
                            dampingFactor={0.05}
                            minDistance={maxDim * 0.5}
                            maxDistance={maxDim * 4}
                        />

                        {/* Enhanced Lighting */}
                        <ambientLight intensity={0.4} />
                        <directionalLight
                            position={[10, 20, 10]}
                            intensity={1.2}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#14b8a6" />
                        <pointLight position={[10, 5, 10]} intensity={0.2} color="#3b82f6" />

                        {/* Truck Container - Wireframe only */}
                        <mesh position={[truck.width / 2, truck.height / 2, truck.length / 2]}>
                            <boxGeometry args={[truck.width, truck.height, truck.length]} />
                            <meshBasicMaterial
                                color="#10b981"
                                wireframe
                                transparent
                                opacity={0.3}
                            />
                            <Edges color="#10b981" threshold={15} />
                        </mesh>

                        {/* Grid helper on the floor */}
                        <gridHelper
                            args={[Math.max(truck.width, truck.length) * 2, 20, '#334155', '#1e293b']}
                            position={[truck.width / 2, 0.001, truck.length / 2]}
                        />

                        {/* Contact shadows for realism */}
                        <ContactShadows
                            position={[truck.width / 2, 0, truck.length / 2]}
                            opacity={0.4}
                            scale={maxDim * 2}
                            blur={2}
                            far={10}
                        />

                        {/* Packed Items */}
                        {packedItems.map((item) => (
                            <ItemMesh key={item.id} item={item} />
                        ))}
                    </Canvas>
                </Suspense>
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg">
                    <RotateCcw className="w-3 h-3" />
                    Drag to rotate • Scroll to zoom
                </div>
            </div>

            {/* View label */}
            <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono bg-slate-900/60 backdrop-blur px-2 py-1 rounded">
                3D Interactive View
            </div>
        </div>
    );
}

function ItemMesh({ item }: { item: PackedItem }) {
    // Geometry is centered by default. We need to move it so its corner is at item.position
    // Center = item.position + dim/2
    const cx = item.position.x + item.dimensions.width / 2;
    const cy = item.position.y + item.dimensions.height / 2;
    const cz = item.position.z + item.dimensions.length / 2;

    return (
        <mesh position={[cx, cy, cz]} castShadow receiveShadow>
            <boxGeometry args={[item.dimensions.width, item.dimensions.height, item.dimensions.length]} />
            <meshStandardMaterial
                color={item.color}
                transparent
                opacity={0.5}
                roughness={0.3}
                metalness={0.1}
            />
            <Edges color="rgba(0,0,0,0.5)" threshold={15} />
        </mesh>
    );
}
