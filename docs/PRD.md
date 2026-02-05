# Master Product Requirement Document: CaroHans Ventures ERMS

**Project:** Event Rental Management System (ERMS)
**Business Name:** CaroHans Ventures
**Location:** Accra, Ghana
**Currency:** ¢ (Ghana Cedi)
**Version:** 2.1 (Logistics & Financial Hardening)

---

## 1. Executive Summary & Success Metrics

### 1.1 Product Vision
To provide CaroHans Ventures with a robust web application that manages the full rental lifecycle. The system features a clear separation between a high-performance **Admin Dashboard** for internal operations and a mobile-optimized **Client Portal** for external requests.

### 1.2 Success Metrics
*   **Efficiency:** Reduce return processing and fee calculation time to < 5 minutes per order.
*   **Accuracy:** Eliminate manual calculation errors for late fees and missing item charges via automated billing logic.
*   **Inventory Control:** Real-time synchronization of stock levels across all routes.
*   **Validation:** Zero overbooking via database-level atomic checks.

---

## 2. Architecture & Tech Stack

*   **Framework:** Next.js 16+ (App Router)
*   **State Management:** React Context API (`AppProvider`) for global persistent state (Inventory, Orders, Customers).
*   **Database Truth:** Postgres Triggers for financial rollups and stock validation.
*   **Styling:** Tailwind CSS 4.0
*   **Deployment:** Cloudflare (via OpenNext)

---

## 3. User Personas & Access Control

| Persona | Role | Primary Interface | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | Owner/Manager | `/admin/*` | Global management, financial control, and user promotion/revocation. |
| **Client** | Customer | `/portal/*` | Inventory browsing, order history, and profile management. |

### 3.1 Security & Authentication Lifecycle
*   **Enforced Verification:** Users **must** confirm their email address before accessing either interface. Unverified logins are automatically terminated.
*   **Token-Gated Admin Signup:** Admin-level registration requires a valid security token, configurable via the Admin Dashboard.
*   **Automated Re-linking:** The system automatically re-associates returning users with their existing "Offline Client" records based on email matching, restoring access to historical orders.
*   **Role Management:** Admins can promote clients to the Admin role or demote them to standard Client access through the System Access dashboard.

---

## 4. Admin Dashboard Requirements (`/admin`)

### 4.1 System Access & User Management
*   **User List:** Centralized view of all Admins, Registered Clients, and "Offline Clients" (revoked users with preserved records).
*   **Revocation Workflow:**
    *   **Revoke Only:** Deletes login access but unlinks the client record to preserve historical order context.
    *   **Cleanup & Delete:** Permanently removes account and clears selected historical business data.
*   **Order-Aware Deletion:** System scans and displays associated orders before account removal to ensure data integrity.

### 4.2 Overview & Logistics
*   **Live Operations:** Dashboard showing today's pickups, returns, and overdue items.
*   **Order Status Management:** Filterable view of all orders (Pending, Approved, Active, Overdue, Completed).
*   **Status Transitions:** Admin can manually move orders through the lifecycle (e.g., Dispatch, Process Return).

#### 4.1.1 Advanced Order Management (Dashboard)
*   **Default View:** "Recent Orders" (Last 5-10 active/pending items).
*   **Smart Search:** 
    *   **Input:** Accepts numeric (Order ID) or string (Client Name) queries.
    *   **Behavior:** Numeric search returns exact Order match; String search returns all historical orders for that Client.
*   **Slicers (Advanced Filter):**
    *   **Visibility:** Toggled via an "All Filters" button (default: Hidden).
    *   **Layout:** Responsive grid matching Order columns.
    *   **Responsiveness:** 2-column grid on mobile, 1-row layout on desktop (`xl:grid-cols-7`).
*   **Data Cap & Pagination:**
    *   **Limit:** Query results are capped at 200 rows to preserve browser performance.
    *   **Feedback:** Display "Results capped at 200" warning only if the return count equals the limit.
    *   **Expansion:** "View More" button appends data to the table up to the 200 limit.

### 4.2 Inventory Management (`/admin/inventory`)
*   **Edit Mode:** A toggleable mode that enables inline editing of names, categories, and prices.
*   **Search Filtering:** A dedicated text input field to filter the inventory list by Item Name or Category instantly.
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

### 4.4 Client Management (`/admin/clients`)
*   **Expansion Logic:** Admin can click a record to expand it via a chevron UI.
*   **Inline Profile Editing:** Reuses the `ClientProfileForm` in a centered, 60% width card for rapid data updates.
*   **Full Search:** Filter client database by name, email, or phone.

### 4.5 Business Intelligence (`/admin/bi`)
*   **Revenue Trends:** Area charts showing monthly revenue growth.
*   **Customer Segments:** Multi-select filtering by order status, return status, and item integrity.
*   **Key Metrics:** Real-time calculation of Segment Revenue, Average Ticket, and Active Field Load.

---

## 5. Client Portal Requirements (`/portal`)

### 5.1 Rental Catalog (`/portal/inventory`)
*   **Shopping Experience:** Clients can browse the catalog and add items to a persistent cart.
*   **Availability:** Calendar interaction to select Pickup and Return dates.
*   **Checkout:** Seamless "Review Order" flow generating a digital invoice/quote request.

### 5.2 My Orders (`/portal/orders`)
*   **History:** Clients can view past and current rental requests.
*   **Simplified Status:** Status column focuses on primary lifecycle (Active, Pending, Completed) without internal audit tags.

### 5.3 Profile (`/portal/profile`)
*   **Atomic Identity:** Uses separate fields for First Name and Last Name.
*   **Extended Info:** Support for Usernames and Contact Numbers.
*   **Visual Customization:** Editable profile picture using the same **Icon & Color Picker** found in inventory.
*   **Form Validation:** Mandatory fields (First/Last Name, Phone, Email) marked with asterisks and enforced via real-time validation.

---

## 6. Business Logic & Fees

### 6.1 Automated Billing
*   **Late Fees:** Calculated as `Daily Rate * Days Late * Quantity`.
*   **Replacement Cost Fees:** Triggered by damage flags or missing item counts during return processing.
*   **Financial Guardrails:**
    *   **Capped Discounts:** Fixed discounts cannot exceed the rental subtotal (Total floor is $0 before penalties).
    *   **Self-Healing Totals:** Database triggers recalculate `total_amount` on every item or date change, ensuring 100% audit accuracy.

### 6.2 Logistics & Inventory
*   **Atomic Order Placement:** The database performs a blocking availability check during the `submit_order` transaction.
*   **Dynamic Availability:** Catalog "Available" counts are calculated in real-time based on existing orders for the selected dates.
*   **Context-Aware Styling:** 
    *   **Client View:** Binary styling (Green for any available stock, Red for 0). Hides yellow warning states to simplify the browsing experience.
    *   **Admin View:** Triple-state styling (Green for full stock, Yellow for partial bookings, Red for 0).
*   **Unified Presentation:** Admin "Due" amounts are calculated dynamically but hidden from primary order lists to maintain clean accounting views.

---

## 8. Performance & Free Tier Constraints

### 8.1 Connection Policy
All production runtime traffic **MUST** use Port 6543 (Transaction Pooler). Port 5432 is reserved for migrations only. This prevents connection exhaustion on the free tier.

### 8.2 Caching Strategy
*   **Inventory Catalog:** Wrap the inventory fetch logic in `unstable_cache` (or fetch with `next: { tags: ['inventory-public'] }`).
    *   **Cache Strategy:** 1 Hour TTL.
    *   **Revalidation:** Trigger `revalidateTag('inventory-public')` only when an Admin adds, edits, or deletes an item.
    *   **Goal:** Serve the client portal catalog entirely from the Next.js CDN/Cache, hitting the Supabase database 0 times for read-only traffic.
*   **Orders:** No caching (Real-time required).

### 8.3 Optimistic Mutations & UX Standard
To resolve the "page reset" issue:
*   **State Update Pattern:** When an Admin clicks "Approve":
    1.  Immediately update the local orders state in the React Context.
    2.  Display the new status UI instantly.
    3.  Send the request to Supabase in the background.
    4.  Rollback the UI change and show a `NotificationToast` only if the request fails.
*   **Forbidden:** usage of `window.location.reload()` or full `router.refresh()` for single-row updates is **Strictly Prohibited**. Use React State or Context for localized updates.

---

## 7. UX Standards & Design System
*   **Interactive Elements:** Consistent use of custom `Button` and `Card` components.
*   **Compact Mode:** Specialized form scaling for nested/table-expansion views.
*   **Feedback:** Global `NotificationToast` for success/error messages.
*   **Visual Hierarchy:** Use of bold typography, subtle shadows, and "Pencil" badges for editable elements.
*   **Empty States:** Detailed "No Records Found" views with clear calls-to-action.