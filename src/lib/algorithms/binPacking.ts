
import { TruckConfig, CargoItem, PackedItem, Dimensions } from '../types';

interface Position {
    x: number;
    y: number;
    z: number;
}

export function packCargo(truck: TruckConfig, items: CargoItem[]): { packed: PackedItem[]; unpacked: CargoItem[] } {
    // Sort items by Volume Descending to fit large items first
    const sortedItems = [...items].sort((a, b) => {
        const volA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
        const volB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
        // Secondary sort by max dimension if volumes are equal?
        return volB - volA;
    });

    const packed: PackedItem[] = [];
    const unpacked: CargoItem[] = [];

    // Potential anchor points. Start with origin (0,0,0)
    // We place relative to corner.
    let anchorPoints: Position[] = [{ x: 0, y: 0, z: 0 }];

    for (const item of sortedItems) {
        let bestPoint: Position | null = null;
        let pointIndex = -1;

        // Filter anchor points to remove invalid ones (inside packed items)
        // and sort them.
        // Optimization: Check for containment lazily.

        // Sort logic: 
        // Fill Z (length/depth) first? Or Y (height)? 
        // Usually filling bottom (Y=0) then back (Z=0) then left (X=0) is "Best Fit".
        // Let's bias: lowest Y, then lowest Z, then lowest X.
        anchorPoints.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y; // Bottom first
            if (a.z !== b.z) return a.z - b.z; // Back first
            return a.x - b.x; // Left first
        });

        for (let i = 0; i < anchorPoints.length; i++) {
            const point = anchorPoints[i];
            if (canFit(point, item, truck, packed)) {
                bestPoint = point;
                pointIndex = i;
                break;
            }
        }

        if (bestPoint) {
            // Place it
            const newPackedItem: PackedItem = { ...item, position: bestPoint };
            packed.push(newPackedItem);

            // Remove used anchor
            anchorPoints.splice(pointIndex, 1);

            // Add new anchors
            const { width, height, length } = item.dimensions;
            const { x, y, z } = bestPoint;

            const newAnchors = [
                { x: x + width, y: y, z: z }, // Right
                { x: x, y: y + height, z: z }, // Top
                { x: x, y: y, z: z + length }, // Front
            ];

            for (const anchor of newAnchors) {
                // Optimization: check if anchor is within bounds immediately?
                // We can leave it for `canFit` but filtering here saves iterations.
                if (anchor.x < truck.width && anchor.y < truck.height && anchor.z < truck.length) {
                    // Also check if it's already in the list? Unique points only.
                    if (!anchorPoints.some(p => p.x === anchor.x && p.y === anchor.y && p.z === anchor.z)) {
                        anchorPoints.push(anchor);
                    }
                }
            }

        } else {
            unpacked.push(item);
        }
    }

    return { packed, unpacked };
}

function canFit(pos: Position, item: CargoItem, truck: TruckConfig, packed: PackedItem[]): boolean {
    const { width, height, length } = item.dimensions;

    // Boundary check
    // Epsilon for float precision issues? using small tolerance might be good.
    const EPS = 0.001;

    if (pos.x + width > truck.width + EPS) return false;
    if (pos.y + height > truck.height + EPS) return false;
    if (pos.z + length > truck.length + EPS) return false;

    // Overlap check
    for (const p of packed) {
        if (intersect(pos, item.dimensions, p.position, p.dimensions)) {
            return false;
        }
    }

    return true;
}

function intersect(pos1: Position, dim1: Dimensions, pos2: Position, dim2: Dimensions): boolean {
    // Axis-Aligned Bounding Box (AABB) intersection
    // Strict inequality means touching is allowed.
    // Intersection if ALL axes overlap.

    const xOverlap = pos1.x < pos2.x + dim2.width && pos1.x + dim1.width > pos2.x;
    const yOverlap = pos1.y < pos2.y + dim2.height && pos1.y + dim1.height > pos2.y;
    const zOverlap = pos1.z < pos2.z + dim2.length && pos1.z + dim1.length > pos2.z;

    // Note: We might want a tiny margin (EPS) to avoid floating point errors where touching is considered overlap?
    // But strict < and > usually handles touching surfaces fine (touching != overlap).

    // Wait, if pos1.x = 0, width = 1. pos2.x = 1. 0 < 1+w (2) True. 1 > 1 False. No overlap. Correct.

    return xOverlap && yOverlap && zOverlap;
}
