# Master Product Requirement Document: CaroHans Ventures ERMS

**Project:** Event Rental Management System (ERMS)
**Business Name:** CaroHans Ventures
**Location:** Accra, Ghana
**Currency:** ¢ (Ghana Cedi)
**Version:** 2.0 (Next.js App Router Refactor + Advanced Features)

---

## 1. Executive Summary & Success Metrics

### 1.1 Product Vision
To provide CaroHans Ventures with a robust web application that manages the full rental lifecycle. The system features a clear separation between a high-performance **Admin Dashboard** for internal operations and a mobile-optimized **Client Portal** for external requests.

### 1.2 Success Metrics
*   **Efficiency:** Reduce return processing and fee calculation time to < 5 minutes per order.
*   **Accuracy:** Eliminate manual calculation errors for late fees and missing item charges via automated billing logic.
*   **Inventory Control:** Real-time synchronization of stock levels across all routes.
*   **User Adoption:** 100% of internal staff using the system for inventory edits and order approvals.

---

## 2. Architecture & Tech Stack

*   **Framework:** Next.js 15+ (App Router)
*   **State Management:** React Context API (`AppProvider`) for global persistent state (Inventory, Orders, Customers).
*   **Styling:** Tailwind CSS 4.0
*   **Icons:** Material Design Icons (`@mui/icons-material`) via centralized registry.
*   **Deployment:** Vercel (recommended)

---

## 3. User Personas

| Persona | Role | Primary Interface |
| :--- | :--- | :--- |
| **Admin** | Owner/Manager | `/admin/*` (Laptop/Desktop) |
| **Client** | Customer | `/portal/*` (Mobile-First) |

---

## 4. Admin Dashboard Requirements (`/admin`)

### 4.1 Overview & Logistics
*   **Live Operations:** Dashboard showing today's pickups, returns, and overdue items.
*   **Order Status Management:** Filterable view of all orders (Pending, Approved, Active, Overdue, Completed).
*   **Status Transitions:** Admin can manually move orders through the lifecycle (e.g., Dispatch, Process Return).

### 4.2 Inventory Management (`/admin/inventory`)
*   **Edit Mode:** A toggleable mode that enables inline editing of names, categories, and prices.
*   **Add SKU:** Dedicated "Click to add new SKU" row at the bottom of the table.
*   **Draft Validation:** New items must have a valid Name, Category, Price, and Replacement Cost. Click-away validation triggers a "Discard or Keep Editing" prompt.
*   **Visual Customization:** Integrated **Icon & Color Picker** for every item. Supports Material Icons and Emojis with custom Tailwind text colors.
*   **Delete Logic:** One-click deletion with session-based "Don't ask again" preference.
*   **POS Flow (New Order):** Inline customer and date selection that switches the table into "Selection Mode" for rapid order creation.

### 4.3 Advanced Calendar (`/admin/calendar`)
*   **Global Blackouts:** Ability to block dates business-wide (e.g., holidays).
*   **Split Layout:** Calendar view on the left, "Smart Grouped" list of blocked periods on the right.
*   **Selection Modes:** Toggle between "Individual Day" and "Range Selection" modes.
*   **Grouped Visualization:** Consecutive blocked dates are automatically displayed as ranges (e.g., "Dec 24 - Jan 02") in the management list.

### 4.4 Business Intelligence (`/admin/bi`)
*   **Revenue Trends:** Area charts showing monthly revenue growth.
*   **Customer Segments:** Pie charts breaking down the customer base (Corporate, Weddings, etc.).
*   **Key Metrics:** Real-time calculation of Total Revenue, Average Order Value, and Lifetime Customers.

---

## 5. Client Portal Requirements (`/portal`)

### 5.1 Rental Catalog (`/portal/inventory`)
*   **Shopping Experience:** Clients can browse the catalog and add items to a persistent cart.
*   **Availability:** Calendar interaction to select Pickup and Return dates.
*   **Checkout:** Seamless "Review Order" flow generating a digital invoice/quote request.

### 5.2 My Orders (`/portal/orders`)
*   **History:** Clients can view their past and current rental requests with status tracking.

### 5.3 Profile (`/portal/profile`)
*   **Self-Service:** Update contact information (WhatsApp, Email) and default delivery address.

---

## 6. Business Logic & Fees

### 6.1 Automated Billing
*   **Late Fees:** Calculated as `Daily Rate * Days Late * Quantity`.
*   **Replacement Fees:** Triggered by damage flags or missing item counts during return processing.

---

## 7. UX Standards & Design System
*   **Interactive Elements:** Consistent use of custom `Button` and `Card` components.
*   **Feedback:** Global `NotificationToast` for success/error messages.
*   **Visual Hierarchy:** Use of bold typography and subtle shadows to differentiate UI sections.
*   **Empty States:** Detailed "No Records Found" views with clear calls-to-action.