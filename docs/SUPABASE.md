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
*   `stock`: `integer` (Total Fleet Count)
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
*   `total_amount`: `numeric` (Calculated automatically via triggers)
*   `amount_paid`: `numeric`
*   `penalty_amount`: `numeric`
*   `return_status`: `text` (`Early`, `On Time`, `Late`)
*   `item_integrity`: `text` (`Good`, `Damaged`, `Lost`)
*   `closed_at`: `timestamp`
*   `discount_name`: `text`
*   `discount_type`: `text` (`fixed`, `percentage`)
*   `discount_value`: `numeric`

### 1.5 `order_items` Table
Line items for each order.
*   `id`: `bigint` (Primary Key)
*   `order_id`: `bigint` (References `orders.id`)
*   `inventory_id`: `bigint` (References `inventory.id`)
*   `quantity`: `integer`
*   `unit_price`: `numeric`
*   `returned_qty`: `integer`
*   `lost_qty`: `integer`
*   `damaged_qty`: `integer`

### 1.6 `discount_redemptions` Table
Usage tracking for promotional codes.
*   `id`: `bigint` (Primary Key)
*   `discount_id`: `bigint` (References `discounts.id`)
*   `order_id`: `bigint` (References `orders.id`)
*   `client_id`: `bigint` (References `clients.id`)
*   `applied_at`: `timestamptz`
*   `discount_amount_applied`: `numeric`
*   `approval_status`: `text` (`approved`, `pending`, `rejected`)

---

## 2. Business Logic & Triggers

### 2.1 Automated Financials
The system uses Postgres triggers to ensure the `total_amount` column is always correct.
*   **Triggers:** `trg_update_order_total_items` and `trg_update_order_total_details`.
*   **Logic:** Whenever an item is changed or order dates/discounts are updated, the `calculate_expected_order_total` function runs.
*   **Guardrails:** Fixed discounts are capped at the rental subtotal to prevent negative totals.

### 2.2 User Creation Triggers
The system automates profile and client record creation during the signup flow.
*   **Trigger:** `on_auth_user_created` (linked to `handle_new_user` function).
*   **Logic:** 
    1.  Upon a new user record in `auth.users`, the function automatically inserts a record into the `profiles` table with the assigned `role` (from metadata).
    2.  If the role is `client`, it also creates a record in the `clients` table, mapping metadata fields (`first_name`, `last_name`, `phone`, etc.) to the respective columns.
    3.  This ensures data integrity and atomic onboarding without requiring multiple client-side API calls.

---

## 3. Security Hardening

### 3.1 Function Isolation
All critical RPCs and triggers use `SECURITY DEFINER` with a fixed `search_path`.
*   **Fixed Path:** `SET search_path = public, extensions`
*   **Impact:** Prevents malicious search path manipulation from hijacking system-level operations.

### 3.2 Row Level Security (RLS)
Policies are optimized to use `InitPlan` sub-selects for `auth.uid()` to ensure O(1) evaluation complexity.

#### 3.2.1 Profiles
*   **SELECT**: Enable read access for all authenticated users (`true`).
*   **INSERT/UPDATE**: Restricted to the owner using `(SELECT auth.uid()) = id`.

#### 3.2.2 Clients
*   **SELECT/UPDATE**: Restricted to the owner (`user_id = (SELECT auth.uid())`) or any `admin`.
*   **INSERT**: Allowed for authenticated users during onboarding.

#### 3.2.3 Orders
*   **SELECT**: Owner (lookup via `email` match to `auth.jwt()`) or `admin`.
*   **INSERT**: Authenticated users only.
*   **UPDATE**: Restricted to `admin` for status transitions.

#### 3.2.4 Discounts & Redemptions
*   **SELECT**: Consolidated policy allowing access if a coupon is `active` OR the user is an `admin`.
*   **ALL**: Restricted to `admin` role.

---

### 4.3 search_orders (RPC)
Performs a dual-lookup search to minimize network round-trips.
*   **Parameters:** `search_term` (text), `filter_criteria` (jsonb), `limit_count` (int).
*   **Logic:**
    *   **Numeric Check:** If `search_term` is a number, return `WHERE orders.id = search_term`.
    *   **Text Check:** If `search_term` is text, `JOIN clients ON orders.client_id = clients.id` and return `WHERE clients.name ILIKE %search_term%`.
    *   **Apply Filters:** Parse `filter_criteria` to apply standard column filters (e.g., `status = 'Active'`).
    *   **Limit:** Apply `limit_count` (default 200).

---

## 5. Query Optimization & Connection Health

### 5.1 Efficient Data Loading
*   **Pagination:** Ensure orders and clients tables use server-side pagination (`range(0, 50)`) rather than fetching 1000+ rows at once.
*   **Column Selection:** Strict adherence to `select('id, name, status')` rather than `select('*')` for list views to reduce payload size.

### 5.2 Indexing Strategy
To prevent slow queries from locking connections, the following indexes are prioritized:
*   **Client Filtering:** `CREATE INDEX idx_orders_client_id ON orders(client_id);`
*   **Date Range Lookups:** `CREATE INDEX idx_orders_date_range ON orders(start_date, end_date);`
*   **Unused Indexes:** `idx_orders_status` and `idx_order_items_inventory_id` have been removed to optimize write performance.

---

## 6. Database Economy

### 6.1 Connection Management (Supavisor)
Next.js apps must connect via the Transaction Pooler (Port 6543) to prevent connection exhaustion. Free tier limits are strictly managed via this pooler.

### 6.2 Select Policy
`select('*')` is banned for list views. Explicit column selection is required to minimize Egress quotas and improve query plan performance.

### 6.3 RLS & CPU Optimization
Ensure RLS policies index the columns used in filters (`user_id`, `status`, `client_id`) to reduce CPU load. Heavy scans on the free tier can lead to temporary rate limiting.