# CaroHans Ventures ERMS: Comprehensive System Documentation

**Project:** Event Rental Management System (ERMS)  
**Business:** CaroHans Ventures, Accra, Ghana  
**Currency:** Ghana Cedi (¢)  
**Version:** 2.1 (Logistics & Financial Hardening)

---

## 1. Vision & Purpose
CaroHans Ventures ERMS is a high-performance rental management platform designed to make event logistics effortless. It bridges the gap between complex internal logistics and external client discovery, ensuring real-time inventory accuracy and 100% automated financial integrity.

### Success Metrics
*   **Efficiency:** Reduce return processing and fee calculation time to < 5 minutes per order.
*   **Accuracy:** Eliminate manual calculation errors via automated database-level billing logic.
*   **Inventory Control:** Zero overbooking via atomic transaction checks.
*   **User Satisfaction:** Tailored, responsive interfaces for both operational staff and customers.

---

## 2. The Admin Experience (`/admin`)
The Admin interface is a desktop-optimized "Command Center" designed for high-density information management and rapid operational tasks.

### 2.1 Fleet Management (Inventory)
*   **Operational Modes:** Toggle between **Edit Mode** (inline price/stock updates) and **New Order Mode** (POS selection). 
*   **Smart Drafting:** New SKUs require Name, Category, Price, and Replacement Cost. Click-away validation triggers a "Discard or Keep Editing" prompt to prevent incomplete data.
*   **Visual Control:** Integrated icon and color picker for every item. Icons are strictly borderless and background-free in tables to emphasize the asset, following the **87.5% scaling rule**.

### 2.2 Logistics & Intelligence
*   **Smart Scheduling:** The **Block Calendar** handles holidays and maintenance. Consecutive blocked days are intelligently grouped (e.g., "Dec 24 - Jan 02") to maintain a clean workspace.
*   **Deep Search:** Numeric inputs trigger exact Order ID matches; string inputs return a client's entire historical record.
*   **Data Performance:** Results are capped at 200 rows with "View More" capabilities to preserve browser performance.

### 2.3 CRM & Access Control
*   **Expansion UI:** Client rows expand via chevron to reveal a compact `ClientProfileForm` (60% width), allowing for rapid updates without losing context.
*   **Flexible Access (Revocation):** 
    *   **Revoke Only:** Terminates login access but preserves historical order data for business records.
    *   **Cleanup & Delete:** Permanently removes account and clears associated business data.

---

## 3. The Client Experience (`/portal`)
The Client Portal is a mobile-first, simplified experience designed for self-service discovery and order tracking.

### 3.1 Seamless Discovery
*   **Binary Availability:** Unlike the Admin's 3-state view (Green/Yellow/Red), the Portal uses a binary Green (Available) or Red (Out of Stock) to simplify the customer journey.
*   **Persistent Cart:** Cart state is versioned and persists for 7 days across devices, ensuring customers can start shopping on mobile and finish on desktop.

### 3.2 Digital Identity & Re-linking
*   **Personalization:** Clients can customize their profile icon and color, synced with the global `DynamicIcon` system.
*   **Automated Re-linking:** Returning "offline" customers are automatically re-associated with their historical records upon email verification, restoring their order history instantly.

---

## 4. Technical Architecture & Infrastructure

### 4.1 Tech Stack
*   **Frontend:** Next.js 16 (App Router) with Turbopack for high-speed development and builds.
*   **Backend:** Supabase (PostgreSQL, Auth, Real-time).
*   **State Management:** React Context API for optimistic UI updates (Order approvals, stock changes).
*   **Infrastructure:** Deployed via OpenNext to Cloudflare Pages (Edge Runtime).

### 4.2 Database & Connectivity
*   **Connection Policy:** All production traffic uses **Port 6543** (Transaction Pooler) to prevent connection exhaustion.
*   **Caching Strategy:** The public catalog is served via `unstable_cache` with a 1-hour TTL, revalidating only on Admin-driven updates.

---

## 5. UI/UX Design Philosophy (The Teal System)

### 5.1 Visual Standards
*   **Palette:** Primary Teal (`#00BFA5`) paired with professional grays and high-contrast text.
*   **Responsive Scaling:** A global `zoom` strategy handles responsiveness (Mobile: 0.7, Tablet: 0.8, Desktop: 1.0).
*   **Iconography (The 87.5% Rule):** Icons and emojis are scaled to **87.5%** of their containers to ensure "breathing room" and professional alignment.

### 5.2 Interaction Standards
*   **Modal Management:** All overlays use `createPortal` to `document.body`. The `useScrollLock` hook is mandatory to prevent background "scroll leak."
*   **Optimistic UI:** State updates happen instantly on the client-side; `window.location.reload()` is strictly prohibited in favor of localized state management.

---

## 6. Business Logic & Automated Billing

### 6.1 Financial Rollups
*   **Self-Healing Totals:** Postgres triggers recalculate `total_amount` whenever items, dates, or discounts change, ensuring 100% audit accuracy.
*   **Billing Formulas:**
    *   **Late Fees:** `Daily Rate * Days Late * Quantity`.
    *   **Replacement Fees:** Triggered by damage/loss flags during return processing.
    *   **Discount Capping:** Fixed discounts are hard-capped at the subtotal to prevent negative billing.

### 6.2 Security & Authentication
*   **Enforced Verification:** Email confirmation is mandatory for all sessions.
*   **Admin Shield:** Admin signup is gated by a database-verified security token.
*   **Security Definer:** All critical functions use `SECURITY DEFINER` with a fixed `search_path` to prevent search-path manipulation attacks.

---

## 7. Maintenance & Help
The system maintains a "Live Help" system in `apps/web/app/admin/help/page.tsx` and `apps/web/app/portal/help/page.tsx`. These pages **must** be updated alongside any system changes to ensure the Knowledge Base remains the single source of truth for all users.
