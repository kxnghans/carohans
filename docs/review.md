# CaroHans Ventures ERMS - Technical Review

**Document Created:** February 1, 2026  
**Review Scope:** Full codebase analysis covering security, performance, code quality, and architecture.

---

## Executive Summary

The CaroHans ERMS is a well-structured Event Rental Management System with a solid foundation. However, there are several areas requiring attention ranging from **critical security gaps** to **performance optimizations** and **code hygiene improvements**.

| Priority | Category | Issues Found |
|----------|----------|--------------|
| 🔴 Critical | Security | 3 |
| 🟠 High | Performance | 4 |
| 🟡 Medium | Code Quality | 5 |
| 🔵 Low | Architecture | 3 |

---

## 🔴 CRITICAL: Security Issues

### 1. Leaked Password Protection Disabled
**Location:** Supabase Auth Configuration  
**Risk:** HIGH - Users can sign up with compromised passwords

**Finding:**  
Supabase Auth is not checking passwords against the HaveIBeenPwned database. This allows users to use passwords that have been exposed in data breaches.

**Remediation:**
1. Go to Supabase Dashboard → Authentication → Settings → Password
2. Enable "Leaked Password Protection"
3. Reference: [Supabase Password Security Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### 2. Browser Client Placeholder Fallback
**Location:** `apps/web/app/lib/supabase.ts` (Lines 12-14)

**Finding:**
```typescript
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
```

The fallback to placeholder URLs prevents white-screen crashes but could lead to:
- Silent failures where users think they're authenticated
- Misleading error messages
- Difficulty debugging production issues

**Remediation:**
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('CRITICAL: Supabase environment variables are not configured.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
```

---

### 3. Admin Access Token Hardcoded
**Location:** `apps/web/app/signup/page.tsx`

**Finding:**  
The admin signup flow uses a hardcoded access token (`CAROHANS-ADMIN-XXXXXX`). While this provides some protection, the token:
- Cannot be rotated without code deployment
- Is visible in client-side JavaScript (can be extracted)
- Has no expiration or rate limiting

**Remediation Plan:**
1. **Short-term:** Move token to environment variable: `NEXT_PUBLIC_ADMIN_ACCESS_TOKEN`
2. **Medium-term:** Implement invite-only admin registration via Supabase Edge Function
3. **Long-term:** Use Supabase Auth Admin API with service role (server-side only)

---

## 🟠 HIGH: Performance Issues

### 1. RLS Policy Suboptimal Execution
**Location:** Database - `profiles` table  
**Affected Policies:** 
- "Users can insert their own profile"
- "Users can update their own profile"

**Finding:**  
RLS policies are re-evaluating `auth.uid()` for every row instead of caching the result. This causes O(n) function calls instead of O(1).

**Remediation:**
```sql
-- BEFORE (Slow)
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- AFTER (Fast)
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
```

Apply the `(SELECT ...)` wrapper to all RLS policies using `auth.uid()` or `auth.role()`.

---

### 2. Multiple Permissive Policies on `discounts` Table
**Location:** Database - `discounts` table

**Finding:**  
Multiple permissive policies exist for the same role and action:
- "Admins can do everything on coupons"
- "Anyone can read active coupons"

Both policies execute for every SELECT query, doubling evaluation time.

**Remediation:**
Consolidate into a single policy with combined conditions:
```sql
CREATE POLICY "Unified discount read policy" ON discounts
FOR SELECT USING (
  status = 'active' 
  OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);
```

---

### 3. Unused Database Indexes
**Location:** Database

**Finding:**  
The Supabase advisor detected unused indexes that consume storage without providing query benefits. Review and drop indexes that haven't been used in the past 30 days.

**Remediation:**
```sql
-- Identify unused indexes
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop after verification
DROP INDEX IF EXISTS <unused_index_name>;
```

---

### 4. Client-Side Order Filtering in Portal
**Location:** `apps/web/app/portal/orders/page.tsx`

**Finding:**  
Portal orders page fetches ALL orders for a user, then filters client-side. For users with hundreds of orders, this is inefficient.

```typescript
// Line 67-117: All filtering happens in useMemo after full fetch
const filteredOrders = useMemo(() => {
  let result = [...myOrdersRaw]; // Potentially 1000+ orders
  // ... filtering logic
}, [myOrdersRaw, searchQuery, filters]);
```

**Remediation:**
Implement server-side filtering similar to admin's `searchOrders` RPC:
```typescript
// Create: search_client_orders RPC
const { data } = await supabase.rpc('search_client_orders', {
  p_user_email: user.email,
  p_filters: filters,
  p_limit: 25
});
```

---

## 🟡 MEDIUM: Code Quality Issues

### 1. Legacy Field References in DataContext
**Location:** `apps/web/app/context/DataContext.tsx` (Lines 206-216)

**Finding:**
```typescript
.select('first_name, last_name, name, username, phone, email...')
// ...
firstName: client.first_name || client.name?.split(' ')[0] || '',
lastName: client.last_name || client.name?.split(' ').slice(1).join(' ') || '',
```

The code references a legacy `name` field that no longer exists in the database schema. This creates unnecessary fallback logic.

**Remediation:**
Remove `name` references and use `first_name`/`last_name` exclusively.

---

### 2. Debug Files in Production
**Location:** `apps/web/app/debug-hash.ts`

**Finding:**  
A debug file with `console.log` statements exists in the codebase. This should be removed or excluded from production builds.

**Remediation:**
```bash
rm apps/web/app/debug-hash.ts
# Or add to .gitignore if needed for local debugging
```

---

### 3. Inconsistent Error Handling Patterns
**Location:** Multiple service files

**Finding:**  
Error handling varies across services:
- Some throw errors directly: `throw error;`
- Some wrap errors: `throw new Error(error.message);`
- Some log and rethrow: `console.error(...); throw error;`

**Remediation:**
Create a centralized error handler:
```typescript
// apps/web/app/lib/errorHandler.ts
export function handleSupabaseError(error: PostgrestError, context: string): never {
  console.error(`[${context}]`, error);
  throw new Error(error.message || 'An unexpected error occurred');
}
```

---

### 4. Type Safety Gaps in Order Items
**Location:** `apps/web/app/services/orderService.ts` (Line 388-404)

**Finding:**
```typescript
items: data.items.map((i: {
  inventory_id: number;
  quantity: number;
  // ... inline type definition
}) => ({...}))
```

Inline type definitions are scattered across the codebase instead of using shared interfaces.

**Remediation:**
Define types centrally in `apps/web/app/types/supabase.ts` and import them.

---

### 5. Deprecated Middleware Convention
**Location:** `apps/web/middleware.ts`

**Finding:**  
Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. The build shows warnings for this.

**Remediation (Documented):**
Per your `GEMINI.md`, continue using `middleware.ts` with `export const runtime = 'experimental-edge'` for Cloudflare compatibility. This is an **accepted deviation** from Next.js 16 standards.

---

## 🔵 LOW: Architectural Improvements

### 1. Cart State Persistence Strategy
**Location:** `apps/web/app/context/DataContext.tsx` (Lines 86-101)

**Finding:**  
Cart is persisted to localStorage with no expiration. Old cart items could reference discontinued inventory.

**Remediation:**
Add timestamp and validation:
```typescript
interface StoredCart {
  items: CartItem[];
  savedAt: number;
  version: string;
}

// On load, validate items still exist in inventory
// Clear carts older than 7 days
```

---

### 2. Missing Documentation for Database Triggers
**Location:** `docs/SUPABASE.md`

**Finding:**  
The `handle_new_user` trigger is critical to the signup flow but isn't documented in `SUPABASE.md`. This could lead to confusion when onboarding new developers.

**Remediation:**
Add trigger documentation:
```markdown
### 2.4 User Creation Trigger
The `handle_new_user` trigger fires AFTER INSERT on `auth.users`:
- If `raw_user_meta_data->>'role'` = 'admin': Creates `profiles` record
- Otherwise: Creates `clients` record with metadata fields
```

---

### 3. Hardcoded Default Values
**Location:** Various service files

**Finding:**  
Default values like `'icon:User'`, `'text-primary'`, penalty rates (`50`), tax rates (`0`) are hardcoded in multiple places.

**Remediation:**
Centralize defaults:
```typescript
// apps/web/app/lib/constants.ts
export const DEFAULTS = {
  CLIENT_IMAGE: 'icon:User',
  CLIENT_COLOR: 'text-primary',
  LATE_PENALTY_PER_DAY: 50,
  TAX_RATE: 0
};
```

---

## Remediation Priority Matrix

| Issue | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Leaked Password Protection | Low | High | **P0** |
| Admin Token Security | Medium | High | **P0** |
| RLS Policy Optimization | Low | Medium | **P1** |
| Consolidate Discount Policies | Low | Medium | **P1** |
| Server-Side Portal Filtering | Medium | Medium | **P2** |
| Remove Debug Files | Low | Low | **P2** |
| Centralize Error Handling | Medium | Medium | **P3** |
| Document Triggers | Low | Low | **P3** |
| Cart Expiration | Low | Low | **P4** |

---

## Implementation Plan

### Phase 1: Security Hardening (1-2 days)
1. Enable leaked password protection in Supabase Dashboard
2. Move admin token to environment variable
3. Remove placeholder fallback in supabase.ts (fail-fast instead)

### Phase 2: Performance Optimization (1 day)
1. Apply `(SELECT auth.uid())` wrapper to all RLS policies
2. Consolidate discount table policies
3. Drop unused indexes

### Phase 3: Code Quality (2-3 days)
1. Remove legacy `name` field references
2. Delete debug files
3. Create centralized error handler
4. Move inline types to shared interfaces

### Phase 4: Documentation (1 day)
1. Update `SUPABASE.md` with trigger documentation
2. Create `CONSTANTS.md` documenting default values
3. Add inline comments explaining Cloudflare middleware workaround

---

## Conclusion

The CaroHans ERMS has a solid foundation with well-organized contexts, services, and components. The critical security issues should be addressed immediately, followed by the performance optimizations. The code quality improvements can be tackled incrementally as part of ongoing development.

**Overall Health Score: 7.5/10**

The system is production-functional but requires security hardening before handling real customer data at scale.
