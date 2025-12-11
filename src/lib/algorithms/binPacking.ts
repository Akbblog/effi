
import { TruckConfig, CargoItem, PackedItem, Dimensions } from '../types';

interface Position {
    x: number;
    y: number;
    z: number;
}

// ---------------------------------------------------------------------------
// 🧠 CONSTANTS & CONFIGURATION
// ---------------------------------------------------------------------------
const POPULATION_SIZE = 12;      // Number of different sorting permutations to try per gen
const GENERATIONS = 5;           // How many times to evolve (Keep low for real-time speed)
const ELITISM_COUNT = 2;         // Top N solutions to keep unchanged
const MUTATION_RATE = 0.3;       // Probability of swapping items in a sequence

/**
 * 🚀 INTELLIGENT PACKING ALGORITHM
 * 
 * This uses a Hybrid Genetic Algorithm + Heuristic Placement.
 * 
 * 1. CONSTRAINT: LIFO (Delivery Stops) is strict. Group A (Limit) must run before Group B.
 * 2. INTELLIGENCE: The algorithm evolves the ORDER of items *within* a LIFO group.
 * 3. WEIGHT RULES: Heavy items are prioritized for bottom placement (stacking safety).
 * 4. PLACEMENT: Instead of just "Bottom-Left", it evaluates multiple spots to find
 *    the one that maximizes surface contact (Stability) and minimizes gaps.
 */
export function packCargo(truck: TruckConfig, items: CargoItem[]): { packed: PackedItem[]; unpacked: CargoItem[] } {
    const grouper = new LIFO_Grouper(items);
    const packer = new GeneticBinPacker(truck, grouper.groups);

    return packer.solve();
}

// ---------------------------------------------------------------------------
// 🧬 GENETIC ALGORITHM ENGINE
// ---------------------------------------------------------------------------

class GeneticBinPacker {
    constructor(private truck: TruckConfig, private lifoGroups: CargoItem[][]) { }

    solve() {
        // 1. Initialize Population (Random permutations within LIFO groups)
        let population = this.initializePopulation();

        // 2. Evolve
        for (let gen = 0; gen < GENERATIONS; gen++) {
            // Evaluate current population
            const results = population.map(individual => this.evaluate(individual));

            // Sort by fitness (Volume Utilization)
            results.sort((a, b) => b.fitness - a.fitness);

            // Selection & Breeding for next gen
            const elite = results.slice(0, ELITISM_COUNT).map(r => r.individual);
            const children = this.breed(results, POPULATION_SIZE - ELITISM_COUNT);

            population = [...elite, ...children];
        }

        // 3. Final Result (Best of the last generation)
        const bestResult = this.evaluate(population[0]);
        return {
            packed: bestResult.packed,
            unpacked: bestResult.unpacked
        };
    }

    private initializePopulation(): CargoItem[][] {
        const pop: CargoItem[][] = [];
        // Seed 1: Weight + Volume Sort (Heavy items first for bottom placement)
        pop.push(this.flattenGroups(this.lifoGroups.map(g => this.sortByWeightAndVolume(g))));

        // Seed 2: Standard Volume Sort (Heuristic Baseline)
        pop.push(this.flattenGroups(this.lifoGroups.map(g => this.sortByVolume(g))));

        // Seed 3-N: Random permutations
        for (let i = 2; i < POPULATION_SIZE; i++) {
            pop.push(this.flattenGroups(this.lifoGroups.map(g => this.shuffle(g))));
        }
        return pop;
    }

    private evaluate(allItems: CargoItem[]) {
        const packer = new HeuristicPacker(this.truck, allItems);
        const { packed, unpacked } = packer.pack();

        // Fitness = Total Volume Packed
        const packedVol = packed.reduce((sum, item) => sum + this.getVolume(item.dimensions), 0);
        return { fitness: packedVol, individual: allItems, packed, unpacked };
    }

    private breed(rankedResults: any[], count: number): CargoItem[][] {
        const children: CargoItem[][] = [];

        // Simple Tournament Selection or Top-Half
        // We will just take random parents from the top 50%
        const poolSize = Math.max(1, Math.floor(rankedResults.length / 2));
        const breedingPool = rankedResults.slice(0, poolSize).map(r => r.individual);

        while (children.length < count) {
            const parent1 = breedingPool[Math.floor(Math.random() * breedingPool.length)];

            // Cross Over (Order Crossover - OX1, but applied per LIFO group to maintain constraints)
            // Actually, simplest effective mutation for this problem is just maintaining LIFO structure
            // and swapping items within groups.
            const childGroups = this.extractGroups(parent1);
            // Apply Mutation
            const mutatedGroups = childGroups.map(g => (Math.random() < MUTATION_RATE ? this.swapMutation(g) : g));

            children.push(this.flattenGroups(mutatedGroups));
        }

        return children;
    }

    // Helpers
    private getVolume(d: Dimensions) { return d.length * d.width * d.height; }

    private flattenGroups(groups: CargoItem[][]): CargoItem[] {
        return groups.reduce((acc, g) => acc.concat(g), []);
    }

    private extractGroups(flatItems: CargoItem[]): CargoItem[][] {
        // Re-construct groups based on the original IDs to ensure integrity is hard 
        // if we just pass arrays.
        // Easier: Just mapped by the original stop IDs.
        // For simplicity in this "Brain" version, we'll just regenerate based on the 'deliveryStop' property
        // assuming the flat list is already sorted by Stop (which it is, by definition of the problem).
        const groups: Record<number, CargoItem[]> = {};
        flatItems.forEach(item => {
            const stop = item.deliveryStop || 1;
            if (!groups[stop]) groups[stop] = [];
            groups[stop].push(item);
        });
        // Return sorted by stop desc
        return Object.keys(groups).sort((a, b) => Number(b) - Number(a)).map(k => groups[Number(k)]);
    }

    private sortByVolume(items: CargoItem[]) {
        return [...items].sort((a, b) => this.getVolume(b.dimensions) - this.getVolume(a.dimensions));
    }

    // NEW: Sort by weight first (heavy items first), then by volume
    private sortByWeightAndVolume(items: CargoItem[]) {
        return [...items].sort((a, b) => {
            const weightA = a.weight || 0;
            const weightB = b.weight || 0;
            // Primary: Heavy items first (they go to bottom)
            if (weightB !== weightA) return weightB - weightA;
            // Secondary: Larger items first
            return this.getVolume(b.dimensions) - this.getVolume(a.dimensions);
        });
    }

    private shuffle(items: CargoItem[]) {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    private swapMutation(items: CargoItem[]) {
        if (items.length < 2) return items;
        const newItems = [...items];
        const i = Math.floor(Math.random() * newItems.length);
        const j = Math.floor(Math.random() * newItems.length);
        [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
        return newItems;
    }
}

// ---------------------------------------------------------------------------
// 📦 LIFO GROUPER (Constraint Manager)
// ---------------------------------------------------------------------------
class LIFO_Grouper {
    public groups: CargoItem[][] = [];

    constructor(items: CargoItem[]) {
        // Sort items by Delivery Sequence (LIFO)
        // Stop 10 (Last) -> Packed First -> Deepest
        // Stop 1 (First) -> Packed Last -> Door
        const sortedStops = [...new Set(items.map(i => i.deliveryStop || 1))].sort((a, b) => b - a);

        for (const stop of sortedStops) {
            this.groups.push(items.filter(i => (i.deliveryStop || 1) === stop));
        }
    }
}


// ---------------------------------------------------------------------------
// 🏗️ HEURISTIC PLACER (The "Architect")
// ---------------------------------------------------------------------------
class HeuristicPacker {
    private packed: PackedItem[] = [];
    private unpacked: CargoItem[] = [];
    private anchorPoints: Position[] = [{ x: 0, y: 0, z: 0 }];

    constructor(private truck: TruckConfig, private items: CargoItem[]) { }

    pack() {
        for (const item of this.items) {
            this.placeItem(item);
        }
        return { packed: this.packed, unpacked: this.unpacked };
    }

    private placeItem(item: CargoItem) {
        let bestScore = -Infinity;
        let bestMove: { pos: Position, rotated: boolean, pointIndex: number } | null = null;

        // 🧠 SEARCH STRATEGY: Find the anchor point that gives the 'Tightest' fit
        // We evaluate every valid anchor point.
        // We sort anchors slightly to bias Bottom-Back-Left (Gravity) to optimize speed.
        this.anchorPoints.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            if (a.z !== b.z) return a.z - b.z;
            return a.x - b.x;
        });

        for (let i = 0; i < this.anchorPoints.length; i++) {
            const point = this.anchorPoints[i];

            // 1. Try Standard Orientation
            if (this.canFit(point, item.dimensions)) {
                const score = this.calculateScore(point, item.dimensions, item.weight || 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { pos: point, rotated: false, pointIndex: i };
                }
            }

            // 2. Try Rotated Orientation
            const rotatedDims = { length: item.dimensions.width, width: item.dimensions.length, height: item.dimensions.height };
            if (this.canFit(point, rotatedDims)) {
                const score = this.calculateScore(point, rotatedDims, item.weight || 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { pos: point, rotated: true, pointIndex: i };
                }
            }
        }

        if (bestMove) {
            const finalDims = bestMove.rotated
                ? { ...item.dimensions, length: item.dimensions.width, width: item.dimensions.length }
                : item.dimensions;

            const newItem: PackedItem = { ...item, dimensions: finalDims, position: bestMove.pos };
            this.packed.push(newItem);
            this.updateAnchors(bestMove.pos, finalDims, bestMove.pointIndex);
        } else {
            this.unpacked.push(item);
        }
    }

    private calculateScore(pos: Position, dims: Dimensions, weight: number = 0): number {
        // 🎯 SCORING FUNCTION (The Brain)
        // Higher is better.

        // Factor 1: Deepest & Lowest (Gravity & LIFO adherence)
        // We want Z to be small (wait, if we pack Back-to-Front, we want Z=0 first? 
        // No, in standard LIFO with simple coordinates, "back" is usually Z=0 or Z=Max depending on perspective.
        // Assuming the previous algo: sortedItems packed at (0,0,0) first, implies (0,0,0) is the "back" or "deepest safe point".
        // Let's assume (0,0,0) is the optimal starting point (back corner).

        let score = 0;

        // 1. Position Penalty (Minimize X, Y, Z)
        // Weighted: Y (Height) is most expensive (don't float). Z (Length) next.
        score -= (pos.y * 10000000);
        score -= (pos.z * 10000);
        score -= (pos.x * 100);

        // 2. Contact Bonus (Touching other items = Stability)
        // We check immediate neighbors.
        score += this.calculateContactArea(pos, dims) * 50;

        // 3. 🆕 WEIGHT-BASED STACKING RULES
        // Heavy items should be on the bottom (low Y), light items can go higher
        // - Bonus for heavy items at floor level (y ≈ 0)
        // - Penalty for heavy items placed high
        if (weight > 0) {
            const truckHeight = this.truck.height;
            const relativeHeight = pos.y / truckHeight; // 0 = floor, 1 = top

            // Heavy items get bonus when low, penalty when high
            // Weight multiplier: heavier items have more impact
            const weightFactor = Math.min(weight / 100, 10); // Cap at 1000kg for scaling

            if (relativeHeight < 0.1) {
                // At floor level: big bonus for heavy items
                score += weightFactor * 500000;
            } else if (relativeHeight < 0.3) {
                // Low placement: moderate bonus
                score += weightFactor * 200000;
            } else if (relativeHeight > 0.7) {
                // High placement: penalty for heavy items (unsafe stacking)
                score -= weightFactor * 300000;
            }
        }

        return score;
    }

    private calculateContactArea(pos: Position, dims: Dimensions): number {
        let contactArea = 0;
        const EPS = 0.001;
        // Check standard 6 faces? Simplified: Check overlaps on faces.
        // This is expensive, so we do a simple check:
        // Does this item touch the floor?
        if (pos.y < EPS) contactArea += (dims.width * dims.length); // Floor is solid support

        // Check against packed items
        for (const p of this.packed) {
            // Check if 'p' is touching 'pos'
            // Simple AABB touch test
            const isTouching =
                (Math.abs(pos.x - (p.position.x + p.dimensions.width)) < EPS || Math.abs((pos.x + dims.width) - p.position.x) < EPS) ||
                (Math.abs(pos.y - (p.position.y + p.dimensions.height)) < EPS || Math.abs((pos.y + dims.height) - p.position.y) < EPS) ||
                (Math.abs(pos.z - (p.position.z + p.dimensions.length)) < EPS || Math.abs((pos.z + dims.length) - p.position.z) < EPS);

            if (isTouching) {
                // Approximate contact area bonus (not exact intersection area to save cycles)
                // Just rewarding "touch" is often enough to cluster items.
                contactArea += 1;
            }
        }
        return contactArea;
    }

    private canFit(pos: Position, dims: Dimensions): boolean {
        const EPS = 0.001;
        if (pos.x + dims.width > this.truck.width + EPS) return false;
        if (pos.y + dims.height > this.truck.height + EPS) return false;
        if (pos.z + dims.length > this.truck.length + EPS) return false;

        for (const p of this.packed) {
            if (this.intersect(pos, dims, p.position, p.dimensions)) return false;
        }
        return true;
    }

    private intersect(pos1: Position, dim1: Dimensions, pos2: Position, dim2: Dimensions): boolean {
        const EPS = 0.001;
        return (
            pos1.x < pos2.x + dim2.width - EPS && pos1.x + dim1.width > pos2.x + EPS &&
            pos1.y < pos2.y + dim2.height - EPS && pos1.y + dim1.height > pos2.y + EPS &&
            pos1.z < pos2.z + dim2.length - EPS && pos1.z + dim1.length > pos2.z + EPS
        );
    }

    private updateAnchors(pos: Position, dims: Dimensions, usedAnchorIndex: number) {
        // Remove used
        this.anchorPoints.splice(usedAnchorIndex, 1);

        // Add 3 new candidates
        const { width, height, length } = dims;
        const candidates = [
            { x: pos.x + width, y: pos.y, z: pos.z }, // Right side
            { x: pos.x, y: pos.y + height, z: pos.z }, // Top side
            { x: pos.x, y: pos.y, z: pos.z + length }  // Front side
        ];

        for (const p of candidates) {
            if (this.isPointValid(p)) {
                this.anchorPoints.push(p);
            }
        }
    }

    private isPointValid(p: Position): boolean {
        // Within truck?
        if (p.x >= this.truck.width || p.y >= this.truck.height || p.z >= this.truck.length) return false;

        // Already occupied? (Optimization: Check strict inclusion)
        for (const packed of this.packed) {
            if (p.x >= packed.position.x && p.x < packed.position.x + packed.dimensions.width &&
                p.y >= packed.position.y && p.y < packed.position.y + packed.dimensions.height &&
                p.z >= packed.position.z && p.z < packed.position.z + packed.dimensions.length) {
                return false;
            }
        }
        // Duplicate check? (Skipped for speed, or basic check)
        return true;
    }
}
