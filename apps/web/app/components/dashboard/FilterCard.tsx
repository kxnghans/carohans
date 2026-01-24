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
    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 text-left w-full group ${active
      ? 'bg-slate-800 border-slate-800 shadow-xl scale-[1.02]'
      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
  >
    <div className="p-5 relative z-10 flex flex-col h-full justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {status}
        </div>
      </div>
      <div>
        <h3 className={`text-3xl font-bold mb-1 ${active ? 'text-white' : 'text-slate-900'}`}>{count}</h3>
        <p className={`text-sm font-medium ${active ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      </div>
    </div>
    {/* Decorative gradient blob */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`}></div>
  </button>
);
