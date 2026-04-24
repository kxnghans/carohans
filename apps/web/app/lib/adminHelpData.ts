import { Icons } from './icons';

export const adminHelpSections = [
    {
        title: "Order Basics",
        icon: Icons.Truck,
        color: "text-status-active",
        bg: "bg-status-active/10",
        items: [
            {
                label: "The Lifecycle",
                content: "Most orders hit four stages. They come in as Pending. You click Approve. When the client takes the gear, it is Active. When it comes back, it is Completed."
            },
            {
                label: "Pickups and Returns",
                content: "When a client arrives for pickup, pull up their 'Approved' order, verify their ID, hand over the gear, and mark the order 'Active'. Upon return, inspect all items before marking it 'Completed'."
            },
            {
                label: "Reject vs. Cancel",
                content: "Rejecting is your call (e.g., out of stock). Canceling is the client's choice. Both put the gear back on the shelf and release the reservation."
            },
            {
                label: "The Settlement Trap",
                content: "Never complete an order if stuff is broken or missing. Move it to Settlement. This keeps the order open so you remember to collect payments for damages or late fees."
            }
        ],
        proTip: "Use the search bar to find orders by client email or order ID instantly."
    },
    {
        title: "Inventory & Stock",
        icon: Icons.Package,
        color: "text-warning",
        bg: "bg-warning/10",
        items: [
            {
                label: "Real-Time Tracking",
                content: "The 'On Field' number tells you exactly what is currently sitting with clients instead of your warehouse. Stock levels adjust automatically as orders are approved."
            },
            {
                label: "Replacement Costs",
                content: "Set a high Replacement Cost for everything. If gear breaks, the system adds this to the client's bill automatically during the return process."
            },
            {
                label: "Smart Icons",
                content: "Click any item icon to change its symbol or color. The system intelligently switches between Account icons for people and Inventory icons for gear."
            },
            {
                label: "Adding New Gear",
                content: "When new stock arrives, add it immediately to the catalog with clear pictures, correct categories, and accurate pricing so clients can start renting it right away."
            }
        ],
        proTip: "Categorize gear by color (e.g., all chairs in Gold) to make your inventory grid easier to scan."
    },
    {
        title: "Discounts & Promotions",
        icon: Icons.Tag,
        color: "text-secondary",
        bg: "bg-secondary/10",
        items: [
            {
                label: "Track Success",
                content: "Click the Usage count on any promo code. You can see exactly which clients used it and how much revenue it generated."
            },
            {
                label: "Manual Overrides",
                content: "You can apply one-time manual discounts during return audits to handle customer service issues or special concessions."
            }
        ],
        proTip: "Use manual discounts to 'round down' bills for your most loyal clients."
    },
    {
        title: "Calendar & Blackouts",
        icon: Icons.Calendar,
        color: "text-secondary",
        bg: "bg-secondary/10",
        items: [
            {
                label: "Date Rules",
                content: "Block off holidays or maintenance days. The system won't let clients book rentals that overlap with your blackout dates."
            },
            {
                label: "Smart Grouping",
                content: "If you block multiple days in a row, the calendar automatically groups them into a single range for cleaner management."
            }
        ],
        proTip: "Click a range in the calendar list view to delete it instantly."
    },
    {
        title: "Client Database & Access",
        icon: Icons.Users,
        color: "text-accent-primary",
        bg: "bg-accent-primary/10",
        items: [
            {
                label: "Detailed History",
                content: "Expand any client record to see their full order history and total spend. Use this to spot your VIP customers."
            },
            {
                label: "System Access",
                content: "In the Users section, you can promote trusted clients to Admin or demote staff. Only Admins can change prices or override order statuses."
            }
        ],
        proTip: "Keep client phone numbers updated to ensure they get pickup and return reminders."
    },
    {
        title: "Business Intelligence",
        icon: Icons.BarChart,
        color: "text-status-completed",
        bg: "bg-status-completed/10",
        items: [
            {
                label: "Growth Tracking",
                content: "The Growth Dynamics chart compares your revenue to the previous month. Use category filters to see which gear is making the most money."
            },
            {
                label: "Data Exports",
                content: "Use the built-in filters to isolate specific data, then export your insights to track seasonal trends year-over-year."
            }
        ],
        proTip: "Regularly check which gear is 'Never Rented' to decide what to sell off."
    },
    {
        title: "Daily Operations",
        icon: Icons.ClipboardList,
        color: "text-primary",
        bg: "bg-primary/10",
        items: [
            {
                label: "Handling Walk-Ins",
                content: "For clients who walk in without a reservation, have them create an account or create one for them, and place an order to ensure inventory is accurately tracked."
            },
            {
                label: "Quick Adjustments",
                content: "If a client wants to add more gear to a pending order, simply update the items before approving it. If they are already active, create a new supplementary order."
            }
        ],
        proTip: "Keep the dashboard open on a tablet or desktop at the front desk for quick access."
    },
    {
        title: "System Health",
        icon: Icons.Bug,
        color: "text-error",
        bg: "bg-error/10",
        items: [
            {
                label: "Error Logging",
                content: "Technical logs and bug reports are stored in a secondary database (tsdbcatbcixdokdhxhxj). This keeps your business data fast and clean."
            },
            {
                label: "Reporting",
                content: "Use the /bug command in the CLI or the feedback tool. Reports are reviewed daily to ensure the system stays stable."
            }
        ],
        proTip: "Include the Order ID in your bug reports so we can trace the exact issue."
    }
];
