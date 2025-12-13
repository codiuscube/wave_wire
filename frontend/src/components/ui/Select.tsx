import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'ghost';
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  variant = 'default'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseButtonClasses = "flex items-center justify-between transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
  const variantClasses = variant === 'default'
    ? "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
    : "h-auto p-0 bg-transparent border-0 font-mono text-sm text-muted-foreground hover:text-primary gap-1";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseButtonClasses} ${variantClasses}`}
      >
        <span className={selectedOption ? '' : 'text-muted-foreground'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[120px] rounded-sm border border-border bg-popover p-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              className={`w-full rounded-sm px-2 py-1.5 text-left text-sm font-mono hover:bg-accent hover:text-accent-foreground ${
                option.value === value ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
