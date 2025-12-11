
# EFFI - Logistics Load Optimizer SaaS

## Project Overview
**Title:** EFFI (Efficiency Load Optimizer)
**Role:** Senior Full-Stack Architect & 3D Visualization Expert
**Vision:** A web-based SaaS logistics tool to help truck owners maximize cargo space using 3D visualization and bin-packing algorithms.
**Current Status:** MVP Live (Phase 3 Complete). Ready for Vercel Deployment.

## Technical Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Authentication:** NextAuth.js (Credentials, Role-based)
- **3D Engine:** React Three Fiber (R3F) + Drei
- **Styling:** Tailwind CSS (Mobile-First, Glassmorphism)

## Scope of Work & Checklist

### Phase 1: Core Tool Logic (COMPLETED)
- [x] **Project Setup**: Next.js, Tailwind, TypeScript initialized.
- [x] **Truck Configuration**: Editable Dimensions (L/W/H).
- [x] **Cargo Logic**:
    - [x] Standard Pallets (Quick Add).
    - [x] Custom Skids (Flexible dimensions with validation).
- [x] **Algorithm**: 3D Bin Packing Heuristic (Largest Area Fit First).
- [x] **Visualization**:
    - [x] 2D Side Profile View.
    - [x] 3D Interactive View (OrbitControls, Wireframes).
- [x] **UI/UX**: Dark mode, premium glassmorphism design.

### Phase 2: User Architecture & SaaS Foundation (COMPLETED)
- [x] **Database Connection**: MongoDB connection via `lib/db.ts`.
- [x] **User Models**: Mongoose schema with Role (`admin` | `user`) and Status (`pending` | `approved`).
- [x] **Authentication**:
    - [x] Login System with `pending` status enforcement.
    - [x] Registration System with Contact Number & Success Feedback.
    - [x] Admin Override Credentials.
- [x] **Admin Dashboard**:
    - [x] View pending registration requests.
    - [x] Approve or Reject users.
- [x] **Protected Routes**: Secure `dashboard` and `admin` routes.

### Phase 3: Data Persistence (COMPLETED)
- [x] **Save Load Logic**: Save current truck & cargo manifest to database.
- [x] **Load History**: View and restore previous load configurations.
- [x] **Manifest History API**: Endpoints for saving and retrieving user-specific data.

### Phase 4: Advanced Features (IN PROGRESS)
- [x] **Complex Algo**: Stacking rules (heavy on bottom), weight distribution.
- [ ] **Multi-Truck**: Loading multiple trucks in one go.
- [ ] **PDF Export**: Generate loading manifest / Bill of Lading.
- [ ] **Email Notifications**: Auto-email logic for "Account Approved".

## Deployment Instructions
1.  **Environment Variables**:
    *   `MONGODB_URI`
    *   `NEXTAUTH_SECRET`
    *   `NEXTAUTH_URL`
    *   `ADMIN_EMAIL` (e.g., akb@tool.com)
    *   `ADMIN_PASSWORD` (e.g., tool.com)
2.  **Platform**: Vercel (Recommended).
