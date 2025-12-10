
import { TruckConfig, CargoItem, PackedItem, Dimensions } from '../types';

interface Position {
    x: number;
    y: number;
    z: number;
}

export function packCargo(truck: TruckConfig, items: CargoItem[]): { packed: PackedItem[]; unpacked: CargoItem[] } {
    // Sort items by Delivery Sequence (LIFO) -> then Volume
    // Logic: Last Stop (Highest Number) should be packed FIRST (Deepest in truck).
    // First Stop (Lowest Number) should be packed LAST (Closest to door).
    const sortedItems = [...items].sort((a, b) => {
        const stopA = a.deliveryStop || 1;
        const stopB = b.deliveryStop || 1;

        if (stopA !== stopB) {
            return stopB - stopA; // Descending Sort: Stop 10 before Stop 1
        }

        const volA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
        const volB = b.dimensions.length * b.dimensions.width * b.dimensions.height;

        return volB - volA; // Big items first within same stop
    });

    const packed: PackedItem[] = [];
    const unpacked: CargoItem[] = [];

    // Potential anchor points. Start with origin (0,0,0)
    // We place relative to corner.
    let anchorPoints: Position[] = [{ x: 0, y: 0, z: 0 }];

    for (const item of sortedItems) {
        let bestPoint: Position | null = null;
        let pointIndex = -1;
        let bestRotation = false; // false = default, true = rotated 90deg

        // Filter anchor points to remove invalid ones (inside packed items)
        // and sort them.

        // Sort logic: 
        // Bias: lowest Y (gravity), then lowest Z (back), then lowest X (left).
        anchorPoints.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y; // Bottom first
            if (a.z !== b.z) return a.z - b.z; // Back first
            return a.x - b.x; // Left first
        });

        for (let i = 0; i < anchorPoints.length; i++) {
            const point = anchorPoints[i];

            // Try default orientation
            if (canFit(point, item.dimensions, truck, packed)) {
                bestPoint = point;
                pointIndex = i;
                bestRotation = false;
                break;
            }

            // Try rotated orientation (swap length/width)
            const rotatedDims = { ...item.dimensions, length: item.dimensions.width, width: item.dimensions.length };
            if (canFit(point, rotatedDims, truck, packed)) {
                bestPoint = point;
                pointIndex = i;
                bestRotation = true;
                break;
            }
        }

        if (bestPoint) {
            // Place it
            const finalDims = bestRotation
                ? { ...item.dimensions, length: item.dimensions.width, width: item.dimensions.length }
                : item.dimensions;

            const newPackedItem: PackedItem = {
                ...item,
                dimensions: finalDims,
                position: bestPoint
            };
            packed.push(newPackedItem);

            // Remove used anchor
            anchorPoints.splice(pointIndex, 1);

            // Add new anchors
            const { width, height, length } = finalDims;
            const { x, y, z } = bestPoint;

            const newAnchors = [
                { x: x + width, y: y, z: z }, // Right of item
                { x: x, y: y + height, z: z }, // Top of item
                { x: x, y: y, z: z + length }, // Front of item
            ];

            for (const anchor of newAnchors) {
                if (anchor.x < truck.width && anchor.y < truck.height && anchor.z < truck.length) {
                    // Check strict containment in existing items to avoid useless anchors
                    // (Optional optimization: if anchor is inside any packed item, discard it)
                    if (!isPointOccupied(anchor, packed)) {
                        // Unique check
                        if (!anchorPoints.some(p => Math.abs(p.x - anchor.x) < 0.001
                            && Math.abs(p.y - anchor.y) < 0.001
                            && Math.abs(p.z - anchor.z) < 0.001)) {
                            anchorPoints.push(anchor);
                        }
                    }
                }
            }

        } else {
            unpacked.push(item);
        }
    }

    return { packed, unpacked };
}

function isPointOccupied(point: Position, packed: PackedItem[]): boolean {
    for (const p of packed) {
        // Strict inequality: if point is exactly on edge, it's NOT occupied (valid anchor)
        if (point.x >= p.position.x && point.x < p.position.x + p.dimensions.width &&
            point.y >= p.position.y && point.y < p.position.y + p.dimensions.height &&
            point.z >= p.position.z && point.z < p.position.z + p.dimensions.length) {
            return true;
        }
    }
    return false;
}

function canFit(pos: Position, dims: Dimensions, truck: TruckConfig, packed: PackedItem[]): boolean {
    const { width, height, length } = dims;

    // Boundary check
    const EPS = 0.001;

    if (pos.x + width > truck.width + EPS) return false;
    if (pos.y + height > truck.height + EPS) return false;
    if (pos.z + length > truck.length + EPS) return false;

    // Overlap check
    for (const p of packed) {
        if (intersect(pos, dims, p.position, p.dimensions)) {
            return false;
        }
    }

    return true;
}

function intersect(pos1: Position, dim1: Dimensions, pos2: Position, dim2: Dimensions): boolean {
    // Axis-Aligned Bounding Box (AABB) intersection
    // Strict inequality so touching is allowed
    // Using a tiny epsilon to forgive floating point errors that cause slight overlaps
    const EPS = 0.001;

    const xOverlap = pos1.x < pos2.x + dim2.width - EPS && pos1.x + dim1.width > pos2.x + EPS;
    const yOverlap = pos1.y < pos2.y + dim2.height - EPS && pos1.y + dim1.height > pos2.y + EPS;
    const zOverlap = pos1.z < pos2.z + dim2.length - EPS && pos1.z + dim1.length > pos2.z + EPS;

    return xOverlap && yOverlap && zOverlap;
}
