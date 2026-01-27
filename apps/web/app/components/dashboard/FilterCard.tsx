import React from 'react';

interface FilterCardProps {
  title: string;
  count: number;
  status: string;
  active: boolean;
  onClick: () => void;
  color: string;
  icon: any;
}

export const FilterCard = ({ title, count, status, active, onClick, color, icon: Icon }: FilterCardProps) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-[2rem] border-2 transition-all duration-500 text-left w-full group focus:outline-none focus:ring-0 ${active
      ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 scale-[1.03] z-10'
      : 'bg-white border-slate-200 hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/60'
      }`}
  >
    <div className="p-6 sm:p-7 relative z-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className={`p-3 rounded-2xl transition-all duration-500 shadow-sm ${active ? 'bg-white text-slate-900' : 'bg-slate-900 text-white group-hover:scale-110 group-hover:rotate-3'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full transition-colors ${active ? 'bg-white/10 text-slate-400' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900'}`}>
          {status}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
            <h3 className={`text-4xl sm:text-5xl font-black mb-1 tracking-tighter transition-colors ${active ? 'text-white' : 'text-slate-900'}`}>
            {count}
            </h3>
            {active && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mb-2"></div>}
        </div>
        <p className={`text-[11px] sm:text-[12px] font-black uppercase tracking-[0.15em] transition-colors ${active ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
      </div>
    </div>

    {/* Subtle geometric accent */}
    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full border-[32px] transition-all duration-700 opacity-[0.03] ${active ? 'border-white' : 'border-slate-900 group-hover:scale-110'}`}></div>
  </button>
);
