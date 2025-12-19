import { useState, useRef, useEffect } from 'react';
import { AltArrowDown } from '@solar-icons/react';

interface Option {
  value: string;
  label: string;
  shortLabel?: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'model';
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  variant = 'default',
  disabled = false
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
    : variant === 'model'
      ? "font-mono text-xs tracking-widest text-muted-foreground mb-4 border-muted uppercase truncate"
      : "h-auto p-0 bg-transparent border-0 !font-mono text-sm text-muted-foreground hover:text-primary gap-1 ";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${baseButtonClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selectedOption ? '' : 'text-muted-foreground'}>
          {selectedOption?.shortLabel || selectedOption?.label || placeholder}
        </span>
        <AltArrowDown weight="Bold" size={12} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[160px] rounded-sm border border-border bg-popover p-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              className={`w-full rounded-sm px-2 py-1.5 text-left text-sm !font-mono whitespace-nowrap hover:bg-accent hover:text-accent-foreground ${option.value === value ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
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
