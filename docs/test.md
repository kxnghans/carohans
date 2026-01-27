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

## 5. Client Portal & Identity (`/portal/*`)
- [ ] **Rental Catalog:** Items display with correct pricing and availability.
- [ ] **Smart Date Picker:** Selecting a range that includes a blocked date should be prevented or flagged.
- [ ] **Atomic Identity:**
    - [ ] Navigate to `/portal/profile`.
    - [ ] Verify separate fields for "First Name" and "Last Name".
    - [ ] Update "First Name" and verify the combined name updates in the header/layout greeting.
- [ ] **Profile Customization:**
    - [ ] Click the profile picture (hover should show Pencil icon).
    - [ ] Select a new Icon/Color.
    - [ ] **Expectation:** The circular profile badge updates immediately with the selection.
- [ ] **Form Validation:**
    - [ ] Remove the email address and attempt to click "Update Profile".
    - [ ] **Expectation:** Field turns red, and the update is blocked.
- [ ] **Order Tracking:** Submitting an order should immediately list it in `/portal/orders` with a simplified status (Active/Pending/Completed) and NO internal audit tags (Good/On Time).

---

## 6. Admin Client Management (`/admin/clients`)
- [ ] **Search:** Typing "Kwame" filters the table to matching records.
- [ ] **Expansion UI:**
    - [ ] Click a client row.
    - [ ] **Expectation:** Row expands via a chevron animation to reveal a centered "Edit Client Profile" card.
- [ ] **Compact Form:** Verify the expanded profile form uses smaller fonts/inputs and occupies 60% of the row width.
- [ ] **Persistence:** Saving changes in the expanded card correctly updates the primary table row data.

---

## 7. Business Intelligence & Analytics (`/admin/bi`)
- [ ] **Deep Filtering:**
    - [ ] Select "Active" status and "Furniture" category.
    - [ ] **Expectation:** KPI cards and Growth Area Chart update to reflect only that segment.
- [ ] **Responsive Charts:** Resize browser to mobile width and ensure Recharts containers scale correctly.

---

## 8. Error Handling & Edge Cases
- [ ] **Module Resolution:** Ensure no "Module Not Found" errors appear in the console (verifies central icon registry).
- [ ] **Empty States:** Filter orders by a status that has zero records; verify the "No orders found" illustration appears.
- [ ] **Unified Order UI:** Verify that the "Total" column in Admin Order list does NOT show "Due" amounts (these are reserved for the Return Modal).
- [ ] **Validation Race Conditions:** Rapidly clicking "Discard" and "Keep Editing" on the draft row validation.