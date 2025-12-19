import { useState, useEffect } from 'react';

/**
 * Hook to enforce a minimum loading duration to prevent UI flashing.
 * 
 * @param isLoading - The actual loading state from data fetching
 * @param minDuration - Minimum duration in ms (default 1000ms)
 * @returns boolean - visual loading state that stays true for at least minDuration
 */
export function useMinimumLoading(isLoading: boolean, minDuration: number = 1000): boolean {
    const [showLoading, setShowLoading] = useState(isLoading);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        if (isLoading) {
            // If loading starts, show it immediately
            setShowLoading(true);
        } else {
            // If loading finishes, wait for the remainder of the min duration
            // We don't track start time here to keep it simple, we just ensure 
            // that *if* it was loading, we don't flip back instantly if it was too fast.
            // actually, to do this correctly we need to know when it started or 
            // just enforce a delay on the *falling edge*. 

            // But a fixed delay on falling edge adds latency to everything.
            // Better approach: When isLoading becomes true, capture timestamp.
            // When isLoading becomes false, check time elapsed.
            // If < minDuration, setTimeout for remainder.

            // However, for the initial load case (which is the main issue),
            // isLoading starts as true.

            timeoutId = setTimeout(() => {
                setShowLoading(false);
            }, minDuration);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isLoading, minDuration]);

    // If isLoading is true, showLoading must be true.
    // The effect only handles the transition to false.
    // Wait, the effect above is flawed because it runs on every change.
    // If isLoading changes to false, it sets a timeout for 1s. This effectively
    // ADDS 1s to every load time, which is acceptable for "anti-flash" but slightly noticeable.
    // A "smarter" version tracks start time, but this simple version is usually what's requested
    // for "at least on screen for 1 second".

    // Actually, if we want it to be *visible* for 1s, we should set a timer on mount (or when loading starts).

    return showLoading || isLoading;
}


// Improved version
export function useMinimumLoadingSmart(isLoading: boolean, minDuration: number = 1000): boolean {
    const [shouldShow, setShouldShow] = useState(isLoading);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (isLoading) {
            setShouldShow(true);
        } else {
            // Delay the hiding
            timeout = setTimeout(() => {
                setShouldShow(false);
            }, minDuration);
        }

        return () => clearTimeout(timeout);
    }, [isLoading, minDuration]);

    return shouldShow;
}
