"use client";

import { Icons } from '../../lib/icons';
import { Card } from '../../components/ui/Card';
import { useAppStore } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';

export default function PortalHelpPage() {
    const { ShoppingBag, Calendar, Shield, User, Tag } = Icons;
    const { latePenaltyPerDay } = useAppStore();

    const sections = [
        {
            title: "Renting Equipment",
            icon: ShoppingBag,
            color: "text-accent-primary",
            bg: "bg-accent-primary/10",
            items: [
                {
                    label: "Live Availability",
                    content: "Selecting your dates first ensures the catalog shows exactly what is available. Green indicators mean stock is ready; Red means items are sold out for that period."
                },
                {
                    label: "Checkout Process",
                    content: "When items are added, click 'Review Order'. provide your details to generate a digital invoice and lock in your request."
                },
                {
                    label: "Rental Duration",
                    content: "Pricing is calculated daily. The system automatically adjusts the total based on your selected rental window."
                }
            ]
        },
        {
            title: "Promotions & Codes",
            icon: Tag,
            color: "text-secondary",
            bg: "bg-secondary/10",
            items: [
                {
                    label: "Applying Discounts",
                    content: "Enter your code in the 'Code' field. The system validates codes in real-time before you reach checkout."
                },
                {
                    label: "One-Time Use",
                    content: "Special 'One-Time' codes are linked to your email address and can only be used for a single successful order."
                }
            ]
        },
        {
            title: "Order Management",
            icon: Calendar,
            color: "text-success",
            bg: "bg-success/10",
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
                }
            ]
        },
        {
            title: "Account Settings",
            icon: User,
            color: "text-accent-secondary",
            bg: "bg-accent-secondary/10",
            items: [
                {
                    label: "Profile Personalization",
                    content: "Customize your account with a unique avatar and color scheme. The picker features dedicated account and persona icons for a professional touch."
                },
                {
                    label: "Contact Details",
                    content: "Keep your phone number and email up to date to ensure you receive important order notifications."
                }
            ]
        },
        {
            title: "Policies & Terms",
            icon: Shield,
            color: "text-secondary",
            bg: "bg-secondary/10",
            items: [
                {
                    label: "Equipment Care",
                    content: "Clients are responsible for equipment integrity. Standard Replacement Costs apply for any items lost or damaged during the rental."
                },
                {
                    label: "Timely Returns",
                    content: `Late penalties of ${formatCurrency(latePenaltyPerDay)} apply daily if gear is not returned on time, unless a modification request is sent and approved.`
                }
            ]
        }
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8 max-w-4xl mx-auto pb-12">
            <div className="mb-2 px-1">
                <h1 className="text-theme-header text-foreground font-black tracking-tight">Client Portal Guide</h1>
                <p className="text-theme-body text-muted">How to manage your rentals and account.</p>
            </div>

            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <Card key={idx} className="border-border hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl ${section.bg} ${section.color}`}>
                                <section.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-theme-title font-bold text-foreground">{section.title}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="space-y-2">
                                    <h4 className="text-theme-body-bold text-foreground uppercase tracking-widest">{item.label}</h4>
                                    <p className="text-theme-body text-muted leading-relaxed font-medium">
                                        {item.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-border/50">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-accent-primary text-white dark:text-background text-theme-caption font-black uppercase tracking-tighter">
                                Pro-Tip
                            </div>
                            <p className="text-theme-body text-muted mt-2 italic font-medium">
                                {idx === 0 && "Selecting your dates first will ensure item availability is accurate for your event period."}
                                {idx === 1 && "Always double-check your items in the 'Review' stage before confirming your order."}
                                {idx === 2 && "Save your profile information to speed up the checkout process for future rentals."}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
