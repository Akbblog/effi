
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Edges } from '@react-three/drei';
import { TruckConfig, PackedItem } from '@/lib/types';
import { useMemo } from 'react';

interface ThreeViewerProps {
    truck: TruckConfig;
    packedItems: PackedItem[];
}

export default function ThreeViewer({ truck, packedItems }: ThreeViewerProps) {
    // Center camera based on truck size
    const center = useMemo(() => [truck.width / 2, truck.height / 2, truck.length / 2], [truck]);
    const maxDim = Math.max(truck.width, truck.height, truck.length);

    return (
        <div className="w-full h-full min-h-[400px] bg-slate-900/50 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm">
            <Canvas>
                <PerspectiveCamera makeDefault position={[maxDim * 1.5, maxDim * 1.2, maxDim * 1.8]} />
                <OrbitControls target={[center[0], center[1], center[2]] as [number, number, number]} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {/* Truck Wireframe */}
                {/* Positioned at center of its dimensions to align corner at 0,0,0 relative to world? No.
                If box is at [w/2, h/2, l/2], its corner [0,0,0] is at origin.
             */}
                <mesh position={[truck.width / 2, truck.height / 2, truck.length / 2]}>
                    <boxGeometry args={[truck.width, truck.height, truck.length]} />
                    <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.2} />
                </mesh>

                {/* Grid helper on the floor */}
                <gridHelper args={[Math.max(truck.width, truck.length) * 2, 20, 0x444444, 0x222222]} position={[truck.width / 2, 0, truck.length / 2]} />

                {/* Packed Items */}
                {packedItems.map((item) => (
                    <ItemMesh key={item.id} item={item} />
                ))}
            </Canvas>
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
        <mesh position={[cx, cy, cz]}>
            <boxGeometry args={[item.dimensions.width, item.dimensions.height, item.dimensions.length]} />
            <meshStandardMaterial color={item.color} roughness={0.3} metalness={0.1} />
            <Edges color="black" threshold={15} />
        </mesh>
    );
}
