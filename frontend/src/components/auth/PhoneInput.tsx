import { useState } from 'react';
import { Phone } from '@solar-icons/react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const formatPhoneNumber = (input: string): string => {
    // Strip all non-digits
    const digits = input.replace(/\D/g, '');

    // Limit to 10 digits (US number without country code)
    const limited = digits.slice(0, 10);

    // Format as (XXX) XXX-XXXX
    if (limited.length === 0) return '';
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  // Convert display format to E.164 for Supabase
  const getE164 = (formatted: string): string => {
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return '';
  };

  const isValid = getE164(value).length === 12;

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
        <Phone weight="Bold" size={20} />
        <span className="text-sm font-medium">+1</span>
      </div>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder="(555) 123-4567"
        className={`w-full pl-20 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
          focused ? 'border-cyan-500' : isValid && value ? 'border-green-500' : 'border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {isValid && value && !focused && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert formatted phone to E.164
export function toE164(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return '';
}
