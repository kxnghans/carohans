# Test Plan: CaroHans Ventures ERMS v2.0

This document outlines the verification steps required to ensure the application meets the specifications defined in the PRD.

---

## 1. Core Navigation & Architecture
- [ ] **Role Selection:** Landing page (`/`) correctly routes to `/portal/inventory` and `/admin/overview`.
- [ ] **State Persistence:** Adding an item to the cart in `/portal/inventory`, navigating to `/portal/profile`, and returning to `/portal/inventory` should retain the cart count.
- [ ] **Sign Out:** "Sign Out" button in layouts correctly redirects back to the landing page.

---

## 2. Admin Inventory Management (`/admin/inventory`)
- [ ] **Edit Mode Toggle:** Activating "Edit Mode" enables blue highlights on editable cells.
- [ ] **Inline Editing:** Changing a price or name and pressing "Enter" or clicking away saves the data to the session state.
- [ ] **Draft Validation:**
    - [ ] Add a new SKU via the bottom row.
    - [ ] Leave the name as "Enter Name" and click outside the row.
    - [ ] **Expectation:** "Incomplete Item" modal appears.
- [ ] **Icon & Color Picker:**
    - [ ] Enter "Edit Mode".
    - [ ] Click an item icon.
    - [ ] Select a new color (e.g., Green) and a new icon (e.g., Star).
    - [ ] **Expectation:** The table row icon updates immediately with the correct color.
- [ ] **Deletion Logic:**
    - [ ] Click the red trash icon.
    - [ ] Confirm deletion.
    - [ ] Click "Don't ask again" for the next deletion.
    - [ ] **Expectation:** Subsequent deletions in the same session happen instantly.

---

## 3. Order POS Flow (`/admin/inventory`)
- [ ] **Mode Exclusivity:** Activating "New Order" should disable "Edit Mode" and vice versa.
- [ ] **Customer Selection:** The dropdown should list all mock customers correctly.
- [ ] **Selection Mode:** Once customer/dates are picked, the "Order" column (with +/- buttons) should appear.
- [ ] **Order Submission:** Reviewing and confirming an order should add it to the `ORDERS` list and redirect/clear state as expected.

---

## 4. Advanced Calendar (`/admin/layout` -> Block Calendar)
- [ ] **Split View:** Verify the layout shows the calendar on the left and the list on the right (Desktop).
- [ ] **Smart Grouping:**
    - [ ] Select Feb 1st, 2nd, and 3rd in "Individual Mode".
    - [ ] Block them.
    - [ ] **Expectation:** The right panel shows one entry: "Feb 1 - Feb 3".
- [ ] **Today Button:** Navigating to a different year/month and clicking "Today" reorients the view to the current month.
- [ ] **Unblocking:** Clicking the trash icon on a grouped range removes the block for all days in that range.

---

## 5. Client Portal (`/portal/*`)
- [ ] **Rental Catalog:** Items display with correct pricing and availability.
- [ ] **Smart Date Picker:** Selecting a range that includes a blocked date should be prevented or flagged.
- [ ] **Order Submission:** Submitting an order as "Kwame Mensah" should immediately show that order in the `/portal/orders` page.
- [ ] **Profile Update:** Updating the phone number in `/portal/profile` updates the name in the header/layout greeting (if applicable).

---

## 6. Business Intelligence (`/admin/bi`)
- [ ] **Metric Calculation:** Verify "Total Revenue" matches the sum of all `Completed` and `Active` orders in mock data.
- [ ] **Responsive Charts:** Resize browser to mobile width and ensure Recharts containers scale correctly.

---

## 7. Error Handling & Edge Cases
- [ ] **Module Resolution:** Ensure no "Module Not Found" errors appear in the console (verifies central icon registry).
- [ ] **Empty States:** Filter orders by a status that has zero records; verify the "No orders found" illustration appears.
- [ ] **Validation Race Conditions:** Rapidly clicking "Discard" and "Keep Editing" on the draft row validation.