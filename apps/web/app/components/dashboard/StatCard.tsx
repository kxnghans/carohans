import { Icons } from '../../lib/icons';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
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
    <Card noPadding className={`relative overflow-hidden group hover:shadow-xl dark:hover:shadow-none transition-all duration-500 border-none shadow-sm ring-1 ring-border min-h-[160px] sm:min-h-[185px] w-full ${gradientMap[color]}`}>
      {/* Decorative Ghost Icon */}
      <div className={`absolute -right-2 -top-2 p-4 opacity-[0.05] group-hover:opacity-[0.12] transition-all duration-700 group-hover:scale-110 transform rotate-12 text-foreground`}>
        <Icon className="w-16 h-16 sm:w-24 sm:h-24" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 pb-6 sm:pb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${colorMap[color]} transition-all duration-500 group-hover:scale-110`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        {trend !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend > 0 
                ? 'bg-success/10 text-success' 
                : 'bg-error/10 text-error'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              <span className="text-[10px] sm:text-theme-caption font-semibold tracking-tight">{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
            {trendLabel && (
              <span className="text-[8px] sm:text-[9px] font-medium text-muted uppercase tracking-widest">{trendLabel}</span>
            )}
          </div>
        )}
        </div>

        <div className="min-w-0">
          <h3 className="text-muted font-semibold text-[10px] sm:text-theme-caption uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 truncate">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-theme-header text-foreground tracking-tight font-bold truncate">{value}</span>
          </div>
          <p className="mt-1 sm:mt-2 text-muted text-[11px] sm:text-theme-label font-medium leading-tight line-clamp-2">{subtext}</p>
        </div>
      </div>
      
      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-0 group-hover:w-full transition-all duration-700 ease-out ${accentMap[color]}`}></div>
    </Card>
  );
};
