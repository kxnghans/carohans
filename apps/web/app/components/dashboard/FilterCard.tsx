import React from 'react';

interface FilterCardProps {
  title: string;
  count: number;
  status: string;
  active: boolean; // This is actually 'currentStatus' based on usage in AdminOverviewPage
  onClick: () => void;
  color: string;
  icon: any;
}

// In the usage: <FilterCard status="All" active={orderFilter === 'All'} ... />
// The prop names in the previous version were slightly different or used incorrectly.
// Let's align with the actual usage in AdminOverviewPage.

export const FilterCard = ({ title, count, status, active, onClick, icon: Icon, color = 'bg-primary' }: any) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full p-5 sm:p-6 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden flex flex-col justify-between h-full active:scale-[0.97]
        ${active
          ? `${color} dark:bg-primary-text border-transparent text-primary-text dark:text-primary shadow-2xl dark:ring-2 dark:ring-warning/40`
          : 'bg-surface border-border text-muted hover:border-primary hover:shadow-2xl'}
      `}
    >
      <div className={`p-3 rounded-2xl transition-all duration-500 shadow-sm self-start ${active ? 'bg-surface text-primary' : 'bg-primary text-primary-text group-hover:scale-110 group-hover:rotate-3'}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      <div className="mt-6">
        <div className={`text-theme-caption font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full transition-colors inline-block ${active ? 'bg-primary-text/10 text-primary-text/80 dark:bg-primary/20 dark:text-primary/90' : 'bg-background text-muted group-hover:bg-surface group-hover:text-foreground'}`}>
          {title}
        </div>
        <h3 className={`text-theme-header sm:text-[32px] font-black mb-1 tracking-tighter transition-colors mt-2 ${active ? 'text-primary-text dark:text-primary' : 'text-foreground'}`}>
          {count}
        </h3>
      </div>

      {active && (
        <div className="absolute -right-2 -bottom-2 opacity-10 animate-in zoom-in-50 duration-700 pointer-events-none">
          <Icon className="w-24 h-24 rotate-12 text-primary-text dark:text-primary" />
        </div>
      )}
    </button>
  );
};
