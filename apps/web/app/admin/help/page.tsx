"use client";

import { adminHelpSections } from '../../lib/adminHelpData';
import { Card } from '../../components/ui/Card';

export default function AdminHelpPage() {

    return (
        <div className="animate-in fade-in duration-500 space-y-8 w-full max-w-[90rem] mx-auto pb-12">
            <div className="mb-2 px-1">
                <h1 className="text-theme-header text-foreground font-black tracking-tight">Admin Knowledge Base</h1>
                <p className="text-theme-body text-muted">A comprehensive guide to managing your rental operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {adminHelpSections.map((section, idx) => (
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
                        {section.proTip && (
                            <div className="mt-8 pt-4 border-t border-border/50">
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-primary text-white dark:text-background text-theme-caption font-black uppercase tracking-tighter">
                                    Pro-Tip
                                </div>
                                <p className="text-theme-body text-muted mt-2 italic font-medium opacity-80">
                                    {section.proTip}
                                </p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
