interface FilterCardProps {
  title: string;
  count: number;
  status: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FilterCard = ({ title, count, active, onClick, icon: Icon, color = 'bg-primary' }: FilterCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-500 text-center relative overflow-hidden flex flex-col items-center justify-between h-full active:scale-[0.97]
        ${active
          ? `${color} dark:bg-primary-text border-transparent text-primary-text dark:text-primary shadow-2xl dark:ring-2 dark:ring-warning/40`
          : 'bg-surface border-border text-muted hover:border-primary hover:shadow-2xl'}
      `}
    >
      <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-500 shadow-sm ${active ? 'bg-surface text-primary' : 'bg-primary text-primary-text group-hover:scale-110 group-hover:rotate-3'}`}>
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col items-center">
        <div className={`text-theme-subtitle font-normal uppercase tracking-[0.1em] sm:tracking-[0.25em] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors inline-block ${active ? 'bg-primary-text/10 text-primary-text/80 dark:bg-primary/20 dark:text-primary/90' : 'bg-background text-muted group-hover:bg-surface group-hover:text-foreground'}`}>
          {title}
        </div>
        <h3 className={`text-xl sm:text-[32px] font-bold mb-0.5 sm:mb-1 tracking-tighter transition-colors mt-1.5 sm:mt-2 ${active ? 'text-primary-text dark:text-primary' : 'text-foreground'}`}>
          {count}
        </h3>
      </div>

      {active && (
        <div className="absolute -right-2 -bottom-2 opacity-10 animate-in zoom-in-50 duration-700 pointer-events-none">
          <Icon className="w-16 h-16 sm:w-24 sm:h-24 rotate-12 text-primary-text dark:text-primary" />
        </div>
      )}
    </button>
  );
};
