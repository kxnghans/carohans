"use client";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  containerClassName?: string;
}

export const DatePicker = ({ 
  label, 
  value, 
  onChange, 
  className = "",
  containerClassName = ""
}: DatePickerProps) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input 
          type="date"
          className={`w-full p-2.5 border border-border rounded-lg bg-background text-foreground text-theme-label font-medium outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary cursor-pointer transition-colors hover:border-primary/50 ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};
