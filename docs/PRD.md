Master Product Requirement Document: CaroHans Ventures ERMS

Project: Event Rental Management System (ERMS)

Business Name: CaroHans Ventures

Location: Accra, Ghana

Currency: ¢ (Ghana Cedi)

Version: 1.4 (Added Admin POS & Invoice Generator)

1. Executive Summary & Success Metrics

1.1 Product Vision

To provide CaroHans Ventures with a robust web application that manages the full rental lifecycle. The system allows clients in Accra to request items (tables, chairs, silverware, etc.) via mobile while providing the Admin with a data-rich laptop dashboard to track inventory, approve orders, and manage automated billing for late returns or damages.

1.2 Success Metrics

Efficiency: Reduce return processing and fee calculation time to < 5 minutes per order.

Accuracy: Eliminate manual calculation errors for late fees and missing item charges.

Control: 100% accuracy in date-based availability, accounting for holidays and maintenance.

2. User Personas & Device Optimization

Persona

Primary Device

Goal

The Client

Mobile Phone

Browse catalog, submit requests, and track rental status in real-time.

The Staff

Tablet/Laptop

Fast check-out/check-in, counting items, and flagging damages.

The Owner (Admin)

Laptop/Desktop

Full control over inventory, BI reports, calendar overrides, and fee overrides.

3. Core Functional Requirements

3.1 Inventory Management

Item Database: Name, Category, SKU, Daily Rate (¢), Replacement Cost (¢), and Total Physical Stock.

Dynamic Stock Logic: Available Stock = Total Stock - (Sum of Booked/Active Quantities) - (Maintenance/Buffer)

Audit Log: Track who changed stock levels or blocked dates.

3.2 Calendar & Blackout Management (NEW)

The Admin requires the ability to override the standard availability logic by "blacking out" dates.

3.2.1 Global Blackouts (Business-Wide)

Continuous Blocking: Ability to select a date range (e.g., Dec 24 - Jan 2) where the entire shop is marked "Closed." No new orders can be requested for these dates.

Intermittent Blocking: A calendar view where Admin can click specific, non-consecutive days (e.g., every Tuesday for maintenance) to disable bookings.

Client View: Dates are greyed out and unselectable in the booking picker.

3.2.2 Item-Specific Blackouts (SKU-Level)

Maintenance Holds: Block specific items (e.g., "Silverware Set A") for a week for deep cleaning/polishing without affecting the rest of the inventory.

Buffer Management: Manually reduce available quantity for specific high-demand weekends without changing total physical stock.

3.2.3 Conflict Resolution

If an Admin attempts to block a date that already has a "Booked" or "Active" rental, the system must trigger a warning: "Conflict: 3 orders are already scheduled for this period. View Orders or Force Block?"

3.3 Order Lifecycle & Status Management

3.3.1 The Workflow

Quote/Request → [Approval Required/Auto] → Booked → Active → Completed
                                            ↓
                                        Cancelled


3.3.2 Approval Logic

Toggle Settings: Admin can set items to "Auto-Approve" or "Approval Required."

3.4 Client Experience (Mobile-First)

Visual Catalog: Responsive grid of rental items with clear pricing in ¢.

Smart Date Picker: Respects both Global and Item-specific blackout dates in real-time.

Data Capture Onboarding: Mandatory Name, Phone (WhatsApp), Email, and Event Location.

4. The Return Process & Fee Engine (Critical)

4.1 Automated Calculation Logic

A. Late Fees:
if actual_return > scheduled_return: Late Fee = daily_rate * late_days * qty_rented

B. Missing/Damaged Fees:
Replacement Charge = missing_qty * item.replacement_cost

4.2 Check-In Workflow (Staff/Admin)

Identify Order: Search by Order # or Customer Phone.

Item Count: Staff enters "Quantity Returned" per line item.

Damage Toggle: Triggers replacement cost automatically.

Admin Override: Ability to waive fees with a mandatory reason note.

5. Business Intelligence & Reporting

5.1 Owner Dashboard (Laptop)

Calendar Quick-View: A master calendar showing:

Confirmed Pickups/Returns.

Blackout Dates (Global & Item-specific).

Inventory "Heatmap" (Red = 0% available, Green = 100% available).

Quick Actions: "Block Dates," "View Overdue," "Create New Booking."

Revenue Breakdown: Monthly comparison of Base Revenue vs. Fee Revenue.

6. Technical & Security Requirements

6.1 Authentication & RBAC

Admin Role: Access to the Calendar Manager to add/remove blackout dates.

Staff Role: Can view the calendar but cannot add/remove blackout dates.

Client Role: Restricted to viewing available dates only.

6.2 UX Standards

Calendar UI: Drag-to-select for continuous dates; single-click for intermittent dates.

Visual Cues: Different colors for Global Blackouts (e.g., Red) vs. Item Maintenance (e.g., Orange).

7. Open Questions & Roadmap

Item

Status

Priority

Tax (VAT/NHIL)

TBD - Manual entry or auto?

Medium

WhatsApp API

Phase 2 - Auto-notifications

High

Partial Days

Does blocking a date block the whole day or just specific hours?

Low

8. Appendix: Sample Scenario (Blackout)

Scenario: CaroHans Ventures is closing for a private family event on March 15th.

Admin goes to Calendar Manager.

Selects "Global Blackout."

Clicks March 15th.

System Action: All items show ¢0 available for that date. Any client trying to book a range that includes March 15th receives a message: "We are closed on March 15th. Please adjust your dates."