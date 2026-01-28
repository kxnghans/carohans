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

export const FilterCard = ({ title, count, status, active, onClick, icon: Icon }: any) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full p-5 sm:p-6 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden flex flex-col justify-between h-full active:scale-[0.97]
        ${active
          ? 'bg-slate-800 border-slate-800 dark:bg-white dark:border-white text-white dark:text-slate-900 shadow-2xl shadow-indigo-200/40 dark:shadow-none'
          : 'bg-surface border-border text-muted hover:border-slate-900 dark:hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-none'}
      `}
    >
      <div className={`p-3 rounded-2xl transition-all duration-500 shadow-sm self-start ${active ? 'bg-surface text-foreground dark:bg-slate-900 dark:text-white' : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 group-hover:scale-110 group-hover:rotate-3'}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      <div className="mt-6">
        <div className={`text-theme-caption font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full transition-colors inline-block ${active ? 'bg-white/10 dark:bg-slate-900/10 text-slate-300 dark:text-slate-600' : 'bg-background text-muted group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-foreground'}`}>
          {title}
        </div>
        <h3 className={`text-theme-header sm:text-[32px] font-black mb-1 tracking-tighter transition-colors mt-2 ${active ? 'text-white dark:text-slate-900' : 'text-foreground'}`}>
          {count}
        </h3>
      </div>

      {active && (
        <div className="absolute -right-2 -bottom-2 opacity-10 animate-in zoom-in-50 duration-700 pointer-events-none">
          <Icon className="w-24 h-24 rotate-12" />
        </div>
      )}
    </button>
  );
};