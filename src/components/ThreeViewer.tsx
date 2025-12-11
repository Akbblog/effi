'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Edges, ContactShadows, TransformControls, Html } from '@react-three/drei';
import { TruckConfig, PackedItem } from '@/lib/types';
import { useMemo, Suspense, useState } from 'react';
import { Loader2, RotateCcw, Move } from 'lucide-react';
import * as THREE from 'three';

interface ThreeViewerProps {
    truck: TruckConfig;
    packedItems: PackedItem[];
    onItemMove?: (id: string, position: { x: number, y: number, z: number }) => void;
    showLabels?: boolean;
    labelMode?: 'short' | 'detailed';
}

function LoadingFallback() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs text-gray-500">Loading 3D View...</p>
            </div>
        </div>
    );
}

export default function ThreeViewer({ truck, packedItems, onItemMove, showLabels = true, labelMode = 'short' }: ThreeViewerProps) {
    // Center camera based on truck size
    const center = useMemo(() => [truck.width / 2, truck.height / 2, truck.length / 2], [truck]);
    const maxDim = Math.max(truck.width, truck.height, truck.length);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="w-full h-full min-h-[350px] sm:min-h-[400px] relative group">
            {/* Glass container */}
            <div className="absolute inset-0 glass-card-static rounded-2xl overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                    <Canvas
                        shadows
                        onPointerMissed={(e) => {
                            // Only deselect if the click wasn't on the gizmo
                            if (e.type === 'click') setSelectedId(null);
                        }}
                    >
                        <PerspectiveCamera makeDefault position={[maxDim * 1.5, maxDim * 1.2, maxDim * 1.8]} />
                        <OrbitControls
                            target={[center[0], center[1], center[2]] as [number, number, number]}
                            enableDamping
                            dampingFactor={0.05}
                            minDistance={maxDim * 0.5}
                            maxDistance={maxDim * 4}
                            makeDefault // Important for TransformControls to work with OrbitControls
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
                                color="#9ca3af"
                                wireframe
                                transparent
                                opacity={0.15}
                            />
                            <Edges color="#d1d5db" threshold={15} />
                        </mesh>

                        {/* Very light gray reference grid */}
                        <gridHelper
                            args={[Math.max(truck.width, truck.length) * 1.5, 30, '#e5e7eb', '#f3f4f6']}
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
                            <ItemMesh
                                key={item.id}
                                item={item}
                                truck={truck}
                                isSelected={selectedId === item.id}
                                onSelect={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(item.id);
                                }}
                                onItemMove={onItemMove}
                                showLabel={showLabels}
                                labelMode={labelMode}
                            />
                        ))}
                    </Canvas>
                </Suspense>
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/90 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-lg">
                    <RotateCcw className="w-3 h-3" />
                    Drag to rotate • Scroll to zoom
                </div>
            </div>

            {/* Editor mode hint */}
            {onItemMove && (
                <div className="absolute top-4 left-4 pointer-events-none">
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 backdrop-blur px-3 py-1.5 rounded-lg">
                        <Move className="w-3 h-3" />
                        Editor Mode Active
                    </div>
                </div>
            )}
        </div>
    );
}

interface ItemMeshProps {
    item: PackedItem;
    truck: TruckConfig;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onItemMove?: (id: string, position: { x: number, y: number, z: number }) => void;
    showLabel?: boolean;
    labelMode?: 'short' | 'detailed';
}

function ItemMesh({ item, truck, isSelected, onSelect, onItemMove, showLabel = true, labelMode = 'short' }: ItemMeshProps) {
    // Geometry is centered by default. We need to move it so its corner is at item.position
    // Center = item.position + dim/2
    const cx = item.position.x + item.dimensions.width / 2;
    const cy = item.position.y + item.dimensions.height / 2;
    const cz = item.position.z + item.dimensions.length / 2;

    const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

    return (
        <group>
            {isSelected && onItemMove && mesh ? (
                <TransformControls
                    object={mesh}
                    mode="translate"
                    translationSnap={0.1}
                    onMouseUp={() => {
                        if (mesh) {
                            const newCenter = mesh.position;
                            let cornerX = newCenter.x - item.dimensions.width / 2;
                            let cornerY = newCenter.y - item.dimensions.height / 2;
                            let cornerZ = newCenter.z - item.dimensions.length / 2;

                            // Clamp to Truck Boundaries
                            cornerX = Math.max(0, Math.min(cornerX, truck.width - item.dimensions.width));
                            cornerY = Math.max(0, Math.min(cornerY, truck.height - item.dimensions.height));
                            cornerZ = Math.max(0, Math.min(cornerZ, truck.length - item.dimensions.length));

                            // Snap to nearest 0.1
                            cornerX = Math.round(cornerX * 10) / 10;
                            cornerY = Math.round(cornerY * 10) / 10;
                            cornerZ = Math.round(cornerZ * 10) / 10;

                            const finalCorner = { x: cornerX, y: cornerY, z: cornerZ };
                            onItemMove(item.id, finalCorner);
                        }
                    }}
                />
            ) : null}

            <mesh
                ref={setMesh}
                position={[cx, cy, cz]}
                onClick={onSelect}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[item.dimensions.width, item.dimensions.height, item.dimensions.length]} />
                <meshStandardMaterial
                    color={item.color}
                    transparent
                    opacity={0.8}
                    roughness={0.3}
                    metalness={0.1}
                    emissive={isSelected ? '#ffffff' : '#000000'}
                    emissiveIntensity={isSelected ? 0.2 : 0}
                />
                <Edges color={isSelected ? "white" : "rgba(0,0,0,0.5)"} threshold={15} />
            </mesh>
            {showLabel && (
                <Html
                    position={[cx, cy + item.dimensions.height / 2 + 0.04, cz]}
                    center
                    occlude
                    distanceFactor={Math.max(1, 4 / Math.max(truck.width, truck.length, truck.height))}
                >
                    <div className={`px-2 py-1 rounded-md shadow-md text-xs bg-white/95 border border-gray-200 ${isSelected ? 'ring-1 ring-red-300' : ''}`}>
                        {labelMode === 'short' ? (
                            <div className="font-medium text-gray-800">
                                {item.name ? (item.name.length > 24 ? item.name.slice(0, 21) + '...' : item.name) : `#${item.id.slice(0, 6)}`}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-800">
                                <div className="font-semibold">{item.name || `#${item.id.slice(0, 6)}`}</div>
                                <div className="text-gray-500">{item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} m</div>
                                <div className="text-gray-500">Stop {item.deliveryStop || 1}</div>
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}
