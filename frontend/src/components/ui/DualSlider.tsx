import { useState, useCallback, useRef, useEffect } from 'react';

interface DualSliderProps {
    min?: number;
    max?: number;
    step?: number;
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
    className?: string;
    minStepsBetweenThumbs?: number;
}

export function DualSlider({
    min = 0,
    max = 100,
    step = 1,
    value,
    onValueChange,
    className = '',
    minStepsBetweenThumbs = 0
}: DualSliderProps) {
    const [internalValue, setInternalValue] = useState<[number, number]>(value);

    // Stable refs
    const trackRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef<'min' | 'max' | null>(null);
    const dragValues = useRef(value);

    useEffect(() => {
        setInternalValue(value);
        dragValues.current = value;
    }, [value]);

    const getPercentage = useCallback((val: number) => {
        return ((val - min) / (max - min)) * 100;
    }, [min, max]);

    const getValueFromPointer = useCallback((clientX: number) => {
        if (!trackRef.current) return min;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const rawValue = min + percent * (max - min);
        // Round to step precision, handling floating point issues
        const steps = Math.round((rawValue - min) / step);
        const snapped = min + steps * step;
        // Fix floating point precision (e.g., 0.5 + 0.5 + 0.5 = 1.5000000000000002)
        const decimals = step.toString().split('.')[1]?.length || 0;
        return Number(snapped.toFixed(decimals));
    }, [min, max, step]);

    // Core Drag Logic
    const handleDrag = useCallback((clientX: number) => {
        if (!isDragging.current) return;

        const newValue = getValueFromPointer(clientX);
        const clampedValue = Math.max(min, Math.min(max, newValue));
        const [currentMin, currentMax] = dragValues.current;

        let nextMin = currentMin;
        let nextMax = currentMax;

        if (isDragging.current === 'min') {
            const limit = currentMax - (step * minStepsBetweenThumbs);
            nextMin = Math.min(clampedValue, limit);
        } else {
            const limit = currentMin + (step * minStepsBetweenThumbs);
            nextMax = Math.max(clampedValue, limit);
        }

        // Only update if values actually changed
        if (nextMin === currentMin && nextMax === currentMax) return;

        const nextValue: [number, number] = [nextMin, nextMax];
        dragValues.current = nextValue;
        setInternalValue(nextValue);
        onValueChange(nextValue);
    }, [getValueFromPointer, min, max, step, minStepsBetweenThumbs, onValueChange]);

    // Mouse Handlers
    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleDrag(e.clientX);
    }, [handleDrag]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isDragging.current = thumb;
        // Ensure refs are fresh
        dragValues.current = internalValue;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Touch Handlers
    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            handleDrag(e.touches[0].clientX);
        }
    }, [handleDrag]);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = null;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }, [handleTouchMove]);

    const handleTouchStart = (thumb: 'min' | 'max') => (e: React.TouchEvent) => {
        e.stopPropagation();
        isDragging.current = thumb;
        // Ensure refs are fresh
        dragValues.current = internalValue;

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Calculate percentages for render
    const minPercent = getPercentage(internalValue[0]);
    const maxPercent = getPercentage(internalValue[1]);

    return (
        <div
            ref={trackRef}
            className={`relative h-5 w-full flex items-center select-none touch-none ${className}`}
            data-vaul-no-drag
        >
            {/* Track Background */}
            <div className="absolute h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                {/* Active Range - no transition for instant feedback */}
                <div
                    className="absolute h-full bg-primary"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`
                    }}
                />
            </div>

            {/* Min Thumb */}
            <div
                role="slider"
                aria-label="Minimum value"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={internalValue[0]}
                tabIndex={0}
                className="absolute h-4 w-4 rounded-full border border-primary/50 bg-background shadow-sm hover:scale-110 transition-transform cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-20"
                style={{ left: `calc(${minPercent}% - 8px)` }}
                onMouseDown={handleMouseDown('min')}
                onTouchStart={handleTouchStart('min')}
            />

            {/* Max Thumb */}
            <div
                role="slider"
                aria-label="Maximum value"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={internalValue[1]}
                tabIndex={0}
                className="absolute h-4 w-4 rounded-full border border-primary/50 bg-background shadow-sm hover:scale-110 transition-transform cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-20"
                style={{ left: `calc(${maxPercent}% - 8px)` }}
                onMouseDown={handleMouseDown('max')}
                onTouchStart={handleTouchStart('max')}
            />
        </div>
    );
}
