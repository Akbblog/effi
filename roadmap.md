
# EFFI - Product Roadmap & Future Vision

This document outlines potential future features and strategic directions for the EFFI platform, moving beyond the current MVP.

## Phase 4: Advanced Logic & Operational Safety (Immediate Next Steps)

This phase answers the question: *"Is this load legal, safe, and practical?"*

### 1. Stability & Stacking Rules
- **Problem**: Current packing ignores item fragility or weight. Heavy items could crush lighter ones.
- **Solution**: Implement constraints:
  - **"Heavy on Bottom"**: Sort vertical placement by density/weight.
  - **"Non-Stackable" Flag**: Allow users to mark items that cannot have anything placed on top.
  - **Rotation Constraints**: "This side up" logic (don't rotate liquid containers).

### 2. Weight Distribution & Safety
- **Problem**: A truck might fit the *volume* but exceed *axle weight limits*.
- **Solution**: 
  - Calculate total weight vs. payload capacity.
  - Visualize "Center of Gravity" (CoG) to ensure the truck isn't unbalanced (danger of tipping).
  - Alert if rear/front axle limits are exceeded (critical for regulatory compliance).

### 3. Multi-Truck Fleet Optimization
- **Problem**: Large orders often exceed a single truck's capacity.
- **Solution**: 
  - Algorithm that accepts a limitless list of cargo.
  - Automatically splits the load: *"You need 2 Trailers and 1 Van."*
  - Optimizes across a mixed fleet (different truck sizes).

### 4. PDF Job Manifests
- **Problem**: 3D screens aren't always available on the loading dock.
- **Solution**: 
  - One-click generated PDF export.
  - **Step-by-Step Loading Plan**: "Step 1: Place Item A at front-left."
  - Printable layout for warehouse staff.

---

## Strategic Roadmap (Long Definition)

### A. Route-Aware Loading (LIFO Logic)
- **Concept**: Delivery trucks make multiple stops.
- **Value**: Use "Last In, First Out" logic. Items for the *first* delivery stop must be closest to the door. Items for the *last* stop must be deep inside.
- **Complexity**: High (Needs integration of Route/Stop order).

### B. Enterprise Data Integration (CSV/Excel)
- **Concept**: Bulk data entry.
- **Value**: Instead of manual entry, allow users to upload `manifest.csv` or `orders.xlsx`. EFFI parses dimensions and quantities instantly. Essential for medium-to-large logistics companies.

### C. Manual 3D Editor (Human-in-the-Loop)
- **Concept**: Drag-and-drop adjustments.
- **Value**: The AI suggestions are great, but sometimes a human needs to tweak a position. Allow clicking and dragging boxes in the 3D view to finalize the plan.

### D. Item Library / "Favorites"
- **Concept**: Quick-access for recurring items.
- **Value**: Users save their standard "IBC Tank", "Euro Pallet", or "Engine Crate" definitions. One-click addition to scene.

### E. E-Commerce / API Integration
- **Concept**: Embedded Shipping Calculator.
- **Value**: Provide an API hook for Shopify/WooCommerce. When a customer checks out, the store queries EFFI to get an instant, accurate shipping container quote based on the cart's volume.


### 5. Hardware Integration (Cubetape & QR)
- **Problem**: Manual data entry is slow and error-prone.
- **Solution**: 
  - **Cubetape Integration**: 
    - **HID Mode**: "Click & Measure" workflow where the device acts as a keyboard.
    - **WebHID**: Future exploration for direct device communication.
  - **QR Code Scanning**:
    - **Scan-to-Load**: Use device camera to scan item QR and auto-add to the truck.
    - **Scan-to-Verify**: Verify loaded items match the manifest.
