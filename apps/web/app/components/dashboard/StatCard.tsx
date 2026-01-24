import { Icons } from '../../lib/icons';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  icon: any;
  color: string;
}

export const StatCard = ({ title, value, subtext, trend, icon: Icon, color }: StatCardProps) => {
  const { TrendingUp } = Icons;
  
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-slate-700`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide">{title}</h3>
        </div>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`flex items-center font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" />}
              {Math.abs(trend)}%
            </span>
          )}
          <span className="text-slate-400">{subtext}</span>
        </div>
      </div>
    </Card>
  );
};
