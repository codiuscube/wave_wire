import { useState, useCallback, useRef, useEffect } from 'react';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  onChange,
  className = ''
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(value);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const percentage = ((internalValue - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percent * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    setInternalValue(clampedValue);
    onChange?.(clampedValue);
  }, [min, max, step, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateValue(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        updateValue(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateValue]);

  return (
    <div
      ref={trackRef}
      className={`relative h-2 w-full cursor-pointer rounded-full bg-secondary ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute h-full rounded-full bg-primary"
        style={{ width: `${percentage}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}
