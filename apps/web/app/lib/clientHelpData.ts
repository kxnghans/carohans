import { Icons } from './icons';
import { formatCurrency } from '../utils/helpers';

export const getClientHelpSections = (latePenaltyPerDay: number) => [
    {
        title: "Renting Gear",
        icon: Icons.ShoppingBag,
        color: "text-accent-primary",
        bg: "bg-accent-primary/10",
        items: [
            {
                label: "Live Availability",
                content: "Selecting your dates first ensures the catalog shows exactly what is available. Green indicators mean stock is ready; Red means items are sold out for that period."
            },
            {
                label: "Finding What You Need",
                content: "Use the search bar at the top of the inventory page to look for specific items, or click the category tags (like 'Tables' or 'Audio') to browse by type."
            },
            {
                label: "The Checkout Process",
                content: "Add items to your cart and hit Review Order. You provide your details, and we lock in the request."
            },
            {
                label: "How We Price",
                content: "We calculate prices by the day. The system automatically adjusts the total based on your selected rental window."
            }
        ],
        proTip: "Selecting your dates first will ensure item availability is accurate for your event period."
    },
    {
        title: "What Happens Next",
        icon: Icons.Calendar,
        color: "text-success",
        bg: "bg-success/10",
        items: [
            {
                label: "Pending vs. Approved",
                content: "When you place an order, it is 'Pending'. This means we are checking the warehouse. When we verify the gear is safe, it changes to 'Approved' and your gear is officially reserved."
            },
            {
                label: "Pickup Logistics",
                content: "On your rental start date, come to our warehouse with your digital invoice and a valid ID. We will help you load the equipment."
            },
            {
                label: "Cancellations",
                content: "You can cancel your order if you change your mind. The gear goes back into the available pool for other people to rent."
            },
            {
                label: "Rejections",
                content: "Sometimes we have to reject an order if gear gets damaged or we catch a scheduling error. This prevents you from showing up to empty shelves."
            }
        ],
        proTip: "Always double-check your items in the 'Review' stage before confirming your order."
    },
    {
        title: "Managing Orders",
        icon: Icons.FileText,
        color: "text-status-active",
        bg: "bg-status-active/10",
        items: [
            {
                label: "Order Tracking",
                content: "Visit 'My Orders' to see progress. 'Active' gear means items are currently out with you."
            },
            {
                label: "Digital Invoices",
                content: "Download or print PDF invoices for any order directly from the order history table."
            },
            {
                label: "Contact Support",
                content: "Use the 'Contact' section to call or text us if you need to adjust your rental dates."
            },
            {
                label: "Extending a Rental",
                content: "If you need the gear for longer than planned, please contact us before your return date to see if an extension is possible, as other clients may be waiting."
            }
        ],
        proTip: "Keep your digital invoice handy on pickup day for faster processing."
    },
    {
        title: "Discounts & Codes",
        icon: Icons.Tag,
        color: "text-secondary",
        bg: "bg-secondary/10",
        items: [
            {
                label: "Promo Codes",
                content: "Type your code in the checkout screen. The system validates codes in real-time so you see your savings immediately."
            },
            {
                label: "One-Time Rules",
                content: "Special 'One-Time' codes are linked to your email address and can only be used for a single successful order."
            }
        ]
    },
    {
        title: "Your Account",
        icon: Icons.User,
        color: "text-accent-secondary",
        bg: "bg-accent-secondary/10",
        items: [
            {
                label: "Personalization",
                content: "Customize your account with a unique avatar and color scheme. It helps our staff recognize your profile quickly."
            },
            {
                label: "Contact Details",
                content: "Keep your phone number and email up to date to ensure you receive important order notifications and alerts."
            }
        ],
        proTip: "Save your profile information to speed up the checkout process for future rentals."
    },
    {
        title: "Policies & Terms",
        icon: Icons.Shield,
        color: "text-secondary",
        bg: "bg-secondary/10",
        items: [
            {
                label: "Equipment Care",
                content: "Clients are responsible for equipment integrity. Standard Replacement Costs apply for any items lost or damaged during the rental."
            },
            {
                label: "Timely Returns",
                content: `Late penalties of ${formatCurrency(latePenaltyPerDay)} apply daily if gear is not returned on time.`
            }
        ]
    },
    {
        title: "Support & Help",
        icon: Icons.AlertCircle,
        color: "text-primary",
        bg: "bg-primary/10",
        items: [
            {
                label: "Reporting Issues",
                content: "Encountered a bug? Use the 'Contact' page to let us know. All technical reports are logged securely for review."
            },
            {
                label: "Feedback",
                content: "We review system logs daily to ensure the best possible experience for our clients."
            }
        ]
    }
];
