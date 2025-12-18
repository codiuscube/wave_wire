import { useState, useRef, useEffect, useCallback } from 'react';

interface DirectionSelectorProps {
    min: number;
    max: number;
    onChange: (min: number, max: number) => void;
    className?: string;
}

export function DirectionSelector({
    min,
    max,
    onChange,
    className = ''
}: DirectionSelectorProps) {
    const [internalMin, setInternalMin] = useState(min);
    const [internalMax, setInternalMax] = useState(max);

    // Refs for drag state to ensure stable event handlers
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef<'min' | 'max' | null>(null);
    const dragValues = useRef({ min, max });

    // Sync state with props
    useEffect(() => {
        setInternalMin(min);
        setInternalMax(max);
        dragValues.current = { min, max };
    }, [min, max]);

    // Calculate coordinates for a degree on the circle
    const getCoordinates = (degree: number, radius: number) => {
        // Adjust for compass rose (0 is North/Top, moving clockwise)
        const rad = (degree - 90) * (Math.PI / 180);
        return {
            x: 50 + radius * Math.cos(rad),
            y: 50 + radius * Math.sin(rad)
        };
    };

    const getDegreeFromEvent = (clientX: number, clientY: number) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let angleRad = Math.atan2(clientY - centerY, clientX - centerX);
        let angleDeg = angleRad * (180 / Math.PI);

        let compassDeg = angleDeg + 90;
        if (compassDeg < 0) compassDeg += 360;
        if (compassDeg >= 360) compassDeg -= 360;

        return Math.round(compassDeg);
    };

    // Main Drag Logic
    const handleDrag = useCallback((clientX: number, clientY: number) => {
        if (!isDragging.current) return;

        const deg = getDegreeFromEvent(clientX, clientY);
        const currentMin = dragValues.current.min;
        const currentMax = dragValues.current.max;

        if (isDragging.current === 'min') {
            // Prevent overlap with max (keep at least 10 degrees apart)
            let diff = currentMax - deg;
            if (diff < 0) diff += 360;

            if (diff < 10) return; // Too close
            if (deg === currentMax) return; // Exact match not allowed

            dragValues.current.min = deg;
            setInternalMin(deg);
            onChange(deg, currentMax);
        } else {
            // Prevent overlap with min
            let diff = deg - currentMin;
            if (diff < 0) diff += 360;

            if (diff < 10) return; // Too close
            if (deg === currentMin) return; // Exact match not allowed

            dragValues.current.max = deg;
            setInternalMax(deg);
            onChange(currentMin, deg);
        }
    }, [onChange]); // Stable dependency

    // Mouse Handlers
    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleDrag(e.clientX, e.clientY);
    }, [handleDrag]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        isDragging.current = type;

        // Ensure refs are fresh
        dragValues.current = { min: internalMin, max: internalMax };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Touch Handlers
    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling while dragging
        if (e.touches.length > 0) {
            handleDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [handleDrag]);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = null;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }, [handleTouchMove]);

    const handleTouchStart = (type: 'min' | 'max') => (e: React.TouchEvent) => {
        e.stopPropagation();
        isDragging.current = type;

        // Ensure refs are fresh
        dragValues.current = { min: internalMin, max: internalMax };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Generate Arc Path
    const createArc = (start: number, end: number) => {
        let angleDiff = end - start;
        if (angleDiff < 0) angleDiff += 360;

        const largeArc = angleDiff > 180 ? 1 : 0;
        const radius = 40;

        const startRad = (start - 90) * (Math.PI / 180);
        const endRad = (end - 90) * (Math.PI / 180);

        const x1 = 50 + radius * Math.cos(startRad);
        const y1 = 50 + radius * Math.sin(startRad);

        const x2 = 50 + radius * Math.cos(endRad);
        const y2 = 50 + radius * Math.sin(endRad);

        if (angleDiff >= 359) {
            return `M ${50 + radius} 50 A ${radius} ${radius} 0 1 1 ${50 + radius - 0.1} 50 Z`;
        }

        return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    const minCoords = getCoordinates(internalMin, 40);
    const maxCoords = getCoordinates(internalMax, 40);

    return (
        <div className={`flex flex-col items-center select-none ${className}`}>
            <div
                ref={containerRef}
                className="relative w-48 h-48 sm:w-56 sm:h-56 touch-none"
            >
                {/* Background Circle */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-800" />
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">N</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">S</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">E</span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">W</span>

                {/* Arc */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <path
                        d={createArc(internalMin, internalMax)}
                        className="fill-primary/20 stroke-primary stroke-1"
                    />
                </svg>

                {/* Handles */}
                {/* Min Handle */}
                <div
                    role="slider"
                    aria-label="Start direction"
                    aria-valuemin={0}
                    aria-valuemax={360}
                    aria-valuenow={internalMin}
                    aria-valuetext={`${internalMin} degrees`}
                    tabIndex={0}
                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing shadow-sm z-10 hover:scale-110 transition-transform flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    style={{
                        left: `${minCoords.x}%`,
                        top: `${minCoords.y}%`
                    }}
                    onMouseDown={handleMouseDown('min')}
                    onTouchStart={handleTouchStart('min')}
                >
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <div className="absolute -top-8 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border">
                        Start: {internalMin}°
                    </div>
                </div>

                {/* Max Handle */}
                <div
                    role="slider"
                    aria-label="End direction"
                    aria-valuemin={0}
                    aria-valuemax={360}
                    aria-valuenow={internalMax}
                    aria-valuetext={`${internalMax} degrees`}
                    tabIndex={0}
                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing shadow-sm z-10 hover:scale-110 transition-transform flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    style={{
                        left: `${maxCoords.x}%`,
                        top: `${maxCoords.y}%`
                    }}
                    onMouseDown={handleMouseDown('max')}
                    onTouchStart={handleTouchStart('max')}
                >
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <div className="absolute -top-8 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border">
                        End: {internalMax}°
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm font-mono text-muted-foreground">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider">Start</span>
                    <span className="text-foreground font-bold">{internalMin}°</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider">Range</span>
                    <span className="text-primary font-bold">
                        {(internalMax - internalMin + 360) % 360 === 0 ? 360 : (internalMax - internalMin + 360) % 360}°
                    </span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider">End</span>
                    <span className="text-foreground font-bold">{internalMax}°</span>
                </div>
            </div>
        </div>
    );
}
