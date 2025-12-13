import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'rogue' | 'rogue-secondary';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium',
      outline: 'border border-border bg-background hover:bg-secondary text-foreground font-medium',
      ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground font-medium',
      rogue: 'font-mono font-bold uppercase transition-all border border-brand-rogue text-brand-rogue bg-transparent rounded-none shadow-[4px_4px_0px_0px_var(--color-brand-rogue)] hover:bg-brand-rogue hover:text-brand-abyss hover:shadow-[2px_2px_0px_0px_var(--color-brand-rogue)] hover:translate-x-[2px] hover:translate-y-[2px]',
      'rogue-secondary': 'font-mono font-bold uppercase tracking-widest bg-brand-abyss border border-border/50 border-b-brand-rogue border-b-2 text-sm rounded-none hover:text-white hover:border-brand-rogue transition-all',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3 text-sm',
      lg: 'h-11 rounded-md px-8',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
