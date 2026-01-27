# Supabase Technical Documentation: CaroHans Ventures ERMS

**Database Engine:** PostgreSQL
**Authentication:** Supabase Auth (JWT)
**Real-time:** Enabled for Order Tracking

---

## 1. Database Schema

### 1.1 `profiles` Table
Manages user roles and system access.
*   `id`: `uuid` (References `auth.users.id`)
*   `role`: `text` (Allowed: `admin`, `client`)
*   `created_at`: `timestamp with time zone`

### 1.2 `clients` Table
Core CRM data for customers.
*   `id`: `bigint` (Primary Key)
*   `user_id`: `uuid` (References `auth.users.id`, nullable)
*   `first_name`: `text`
*   `last_name`: `text`
*   `username`: `text`
*   `name`: `text` (Combined full name for legacy compatibility)
*   `phone`: `text`
*   `email`: `text`
*   `address`: `text` (Optional)
*   `image`: `text` (Stores icon key or emoji)
*   `color`: `text` (Stores Tailwind color class)
*   `total_orders`: `integer`
*   `total_spent`: `numeric`
*   `last_order`: `date`

### 1.3 `inventory` Table
Stock management and rental catalog.
*   `id`: `bigint` (Primary Key)
*   `name`: `text`
*   `category`: `text`
*   `stock`: `integer`
*   `price`: `numeric` (Daily rate)
*   `replacement_cost`: `numeric`
*   `maintenance`: `integer`
*   `image`: `text`
*   `color`: `text`

### 1.4 `orders` Table
Transaction lifecycle tracking.
*   `id`: `bigint` (Primary Key)
*   `client_id`: `bigint` (References `clients.id`)
*   `status`: `text` (`Pending`, `Approved`, `Active`, `Overdue`, `Completed`, `Settlement`)
*   `start_date`: `date`
*   `end_date`: `date`
*   `total_amount`: `numeric`
*   `amount_paid`: `numeric`
*   `penalty_amount`: `numeric`
*   `return_status`: `text` (`Early`, `On Time`, `Late`)
*   `item_integrity`: `text` (`Good`, `Damaged`, `Lost`)
*   `closed_at`: `timestamp`

---

## 2. Row Level Security (RLS)

### 2.1 Inventory
*   **SELECT**: Anonymous access (Public) to allow catalog browsing without login.
*   **ALL**: Restricted to `role = 'admin'` via `profiles` lookup.

### 2.2 Clients
*   **SELECT/UPDATE**: Restricted to the owner (`user_id = auth.uid()`) or any `admin`.
*   **INSERT**: Allowed for authenticated users during onboarding.

### 2.3 Orders
*   **SELECT**: Owner (`client_id` lookup via `email` match to `auth.jwt()`) or `admin`.
*   **INSERT**: Authenticated users only.
*   **UPDATE**: Restricted to `admin` for status transitions.

---

## 3. Maintenance Commands

To refresh types after schema changes:
```bash
cd apps/web && pnpm supabase gen types typescript --local > app/types/supabase.ts
```