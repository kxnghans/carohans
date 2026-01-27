import { Icons } from '../../lib/icons';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  trendLabel?: string;
  icon: any;
  color: 'slate' | 'indigo' | 'emerald' | 'amber';
}

export const StatCard = ({ title, value, subtext, trend, trendLabel, icon: Icon, color }: StatCardProps) => {
  const { TrendingUp, TrendingDown } = Icons;
  
  const colorMap = {
    slate: 'bg-slate-900 shadow-slate-200',
    indigo: 'bg-indigo-600 shadow-indigo-200',
    emerald: 'bg-emerald-600 shadow-emerald-200',
    amber: 'bg-amber-500 shadow-amber-200'
  };

  const accentMap = {
    slate: 'bg-slate-900',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500'
  };

  const gradientMap = {
    slate: 'bg-gradient-to-br from-white to-slate-50/50',
    indigo: 'bg-gradient-to-br from-white to-indigo-50/30',
    emerald: 'bg-gradient-to-br from-white to-emerald-50/30',
    amber: 'bg-gradient-to-br from-white to-amber-50/30'
  };

  return (
    <Card noPadding className={`relative overflow-hidden group hover:shadow-xl transition-all duration-500 border-none shadow-sm ring-1 ring-slate-200/50 min-h-[185px] w-full ${gradientMap[color as keyof typeof gradientMap]}`}>
      {/* Decorative Ghost Icon */}
      <div className={`absolute -right-2 -top-2 p-4 opacity-[0.05] group-hover:opacity-[0.12] transition-all duration-700 group-hover:scale-110 transform rotate-12 text-slate-900`}>
        <Icon className="w-24 h-24" />
      </div>

      <div className="relative z-10 p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div className={`p-3 rounded-2xl ${colorMap[color]} shadow-lg transition-transform duration-500 group-hover:scale-110`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-colors ${
              trend > 0 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] font-black tracking-tight">{trend > 0 ? '+' : ''}{trend}%</span>
              {trendLabel && (
                <span className="text-[9px] font-bold opacity-60 uppercase ml-0.5">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
          </div>
          <p className="mt-2 text-slate-400 text-[11px] font-bold leading-tight">{subtext}</p>
        </div>
      </div>
      
      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-700 ease-out ${accentMap[color]}`}></div>
    </Card>
  );
};
