"use client";

import { Icons } from '../../lib/icons';
import { Card } from '../../components/ui/Card';

export default function AdminHelpPage() {
    const { Truck, Package, BarChart, Shield, Calendar, Users, Tag } = Icons;

    const sections = [
        {
            title: "Operational Logistics",
            icon: Truck,
            color: "text-status-active",
            bg: "bg-status-active/10",
            items: [
                {
                    label: "The Order Lifecycle",
                    content: "Orders transition through: Pending -> Approved -> Active -> Completed. Use the dedicated expansion buttons to access item details and audit logs."
                },
                {
                    label: "Self-Healing Totals",
                    content: "Financial totals are database-enforced. If you change an item price or rental date, the Order Total corrects itself automatically."
                },
                {
                    label: "Managing Returns",
                    content: "The Return Audit highlights Late Fees vs Damage Penalties separately, ensuring clear billing for the client."
                }
            ]
        },
        {
            title: "Promotions & ROI",
            icon: Tag,
            color: "text-secondary",
            bg: "bg-secondary/10",
            items: [
                {
                    label: "Redemption Ledger",
                    content: "Click the 'Usage' count in the discount table to see exactly which clients and orders used a specific promotion."
                },
                {
                    label: "Ad-Hoc Adjustments",
                    content: "Apply one-time manual discounts during return audits to handle customer service goodwill or special concessions."
                }
            ]
        },
        {
            title: "Inventory Control",
            icon: Package,
            color: "text-warning",
            bg: "bg-warning/10",
            items: [
                {
                    label: "Stock Tracking",
                    content: "Stock levels adjust automatically. 'On Field' values reflect gear currently with clients and unavailable for new bookings."
                },
                {
                    label: "Smart Customization",
                    content: "Click any icon to customize its symbol or color. The system intelligently shows Account Icons for staff and Inventory Icons for equipment."
                }
            ]
        },
        {
            title: "Calendar System",
            icon: Calendar,
            color: "text-secondary",
            bg: "bg-secondary/10",
            items: [
                {
                    label: "Global Blackouts",
                    content: "Block specific dates or ranges (e.g., holidays) to prevent any rentals during those periods."
                },
                {
                    label: "Smart Grouping",
                    content: "Consecutive blocked dates are automatically grouped into ranges for easier management."
                }
            ]
        },
        {
            title: "Client Database",
            icon: Users,
            color: "text-accent-primary",
            bg: "bg-accent-primary/10",
            items: [
                {
                    label: "Profile Management",
                    content: "Click to expand any client record. You can edit their details or view their full order history inline."
                },
                {
                    label: "Rapid Search",
                    content: "Instantly find clients by name, email, or phone number using the dedicated search filter."
                }
            ]
        },
        {
            title: "Business Intelligence",
            icon: BarChart,
            color: "text-secondary",
            bg: "bg-secondary/10",
            items: [
                {
                    label: "Revenue Trends",
                    content: "The Growth Dynamics chart tracks monthly revenue. Use the 'Operational Volume' filter to see booking frequency over time."
                },
                {
                    label: "Data Slicing",
                    content: "Use category and status filters to isolate specific performance segments (e.g., 'Furniture' revenue vs 'Decor')."
                }
            ]
        },
        {
            title: "Responsive Interface",
            icon: Icons.SlidersHorizontal,
            color: "text-primary",
            bg: "bg-primary/10",
            items: [
                {
                    label: "Operational Filters",
                    content: "Advanced slicers adapt to your screen. Use the 2-column mobile layout for quick access or the 1-row desktop view for full oversight."
                },
                {
                    label: "Action Mobility",
                    content: "Primary actions like 'Search' and 'New Order' are centered and optimized for thumb-reach on mobile devices."
                }
            ]
        },
        {
            title: "Security & Access",
            icon: Shield,
            color: "text-status-rejected",
            bg: "bg-status-rejected/10",
            items: [
                {
                    label: "Staff Management",
                    content: "Promote clients to Admin or demote users in 'System Access'. Only Admins can edit inventory and override statuses."
                }
            ]
        }
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto pb-12">
            <div className="mb-2 px-1">
                <h1 className="text-theme-header text-foreground font-black tracking-tight">Admin Knowledge Base</h1>
                <p className="text-theme-body text-muted">System documentation and operational guidance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <Card key={idx} className="border-border hover:shadow-md transition-shadow h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl ${section.bg} ${section.color}`}>
                                <section.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-theme-title font-bold text-foreground">{section.title}</h3>
                        </div>
                        <div className="space-y-6 flex-1">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="space-y-1.5 group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors"></div>
                                        <h4 className="text-theme-body-bold text-foreground uppercase tracking-widest">{item.label}</h4>
                                    </div>
                                    <p className="text-theme-body text-muted leading-relaxed pl-3.5 border-l border-border/50 font-medium">
                                        {item.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4 border-t border-border/50">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-status-active text-white dark:text-background text-theme-caption font-black uppercase tracking-tighter">
                                Pro-Tip
                            </div>
                            <p className="text-theme-body text-muted mt-2 italic font-medium">
                                {idx === 0 && "Use the search bar to find orders by client email or order ID instantly."}
                                {idx === 1 && "Setting a high 'Replacement Cost' ensures penalties cover the full value of lost items."}
                                {idx === 2 && "Clicking on a range in the calendar list view will quickly delete the blackout period."}
                                {idx === 3 && "Regularly updating client profiles ensures accurate delivery and billing information."}
                                {idx === 4 && "Export your insights regularly to track year-over-year seasonal growth."}
                                {idx === 5 && "Change the Access Token quarterly to maintain high system security."}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
