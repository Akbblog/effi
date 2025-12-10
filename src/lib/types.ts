
export interface Dimensions {
    length: number; // Z axis (Depth) in meters
    width: number;  // X axis (Width) in meters
    height: number; // Y axis (Height) in meters
}

export type TruckConfig = Dimensions;

export type CargoType = 'standard' | 'custom';

export interface CargoItem {
    id: string;
    type: CargoType;
    dimensions: Dimensions;
    color: string;
    name?: string;
}

export interface PackedItem extends CargoItem {
    position: { x: number; y: number; z: number };
}
