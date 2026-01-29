import { Icons } from '../../lib/icons';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  trendLabel?: string;
  icon: any;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'accent';
}

export const StatCard = ({ title, value, subtext, trend, trendLabel, icon: Icon, color }: StatCardProps) => {
  const { TrendingUp, TrendingDown } = Icons;
  
  const colorMap = {
    primary: 'bg-primary text-primary-text shadow-primary/20 dark:shadow-none',
    secondary: 'bg-secondary text-primary-text shadow-secondary/20 dark:shadow-none',
    success: 'bg-success text-primary-text shadow-success/20 dark:shadow-none',
    warning: 'bg-warning text-primary-text shadow-warning/20 dark:shadow-none',
    accent: 'bg-accent-primary text-primary-text shadow-accent-primary/20 dark:shadow-none'
  };

  const accentMap = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    accent: 'bg-accent-primary'
  };

  const gradientMap = {
    primary: 'bg-surface dark:bg-primary/5',
    secondary: 'bg-surface dark:bg-secondary/5',
    success: 'bg-surface dark:bg-success/5',
    warning: 'bg-surface dark:bg-warning/5',
    accent: 'bg-surface dark:bg-accent-primary/5'
  };

  return (
    <Card noPadding className={`relative overflow-hidden group hover:shadow-xl dark:hover:shadow-none transition-all duration-500 border-none shadow-sm ring-1 ring-border min-h-[185px] w-full ${gradientMap[color]}`}>
      {/* Decorative Ghost Icon */}
      <div className={`absolute -right-2 -top-2 p-4 opacity-[0.05] group-hover:opacity-[0.12] transition-all duration-700 group-hover:scale-110 transform rotate-12 text-foreground`}>
        <Icon className="w-24 h-24" />
      </div>

      <div className="relative z-10 p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div className={`p-3 rounded-2xl ${colorMap[color]} transition-all duration-500 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-colors ${
              trend > 0 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-error/10 text-error border-error/20'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span className="text-theme-caption font-black tracking-tight">{trend > 0 ? '+' : ''}{trend}%</span>
              {trendLabel && (
                <span className="text-[9px] font-bold opacity-60 uppercase ml-0.5">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-muted font-black text-theme-caption uppercase tracking-[0.15em] mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-theme-header text-foreground tracking-tight">{value}</span>
          </div>
          <p className="mt-2 text-muted text-theme-label font-medium leading-tight">{subtext}</p>
        </div>
      </div>
      
      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-700 ease-out ${accentMap[color]}`}></div>
    </Card>
  );
};
