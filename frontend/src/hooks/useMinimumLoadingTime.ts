import { useState, useEffect } from 'react';

/**
 * Enforces a minimum loading time to prevent skeleton flashing on fast networks.
 * Similar to how YouTube/Amazon handle loading states.
 * 
 * @param actualLoading - The actual loading state from API/data fetching
 * @param minDisplayTime - Minimum time to display loading state (default 300ms)
 * @returns Display loading state that respects minimum time
 */
export function useMinimumLoadingTime(
    actualLoading: boolean,
    minDisplayTime: number = 300
): boolean {
    const [displayLoading, setDisplayLoading] = useState(true);
    const [startTime] = useState(() => Date.now());

    useEffect(() => {
        if (!actualLoading) {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minDisplayTime - elapsed);

            // OSTT FIX: Always use a timer (even if 0ms) to avoid set-state-in-effect synchronous cascade
            const timer = setTimeout(() => {
                setDisplayLoading(false);
            }, remaining);

            return () => clearTimeout(timer);
        }
    }, [actualLoading, startTime, minDisplayTime]);

    return displayLoading;
}
