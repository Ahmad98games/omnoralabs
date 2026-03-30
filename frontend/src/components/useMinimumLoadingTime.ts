import { useState, useEffect, useRef } from 'react';

export function useMinimumLoadingTime(isLoading: boolean, minDuration: number = 400): boolean {
    const [shouldShowSkeleton, setShouldShowSkeleton] = useState(isLoading);
    const [prevIsLoading, setPrevIsLoading] = useState(isLoading);
    const startTimeRef = useRef<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Adjust state during render based on prop change
    if (isLoading !== prevIsLoading) {
        setPrevIsLoading(isLoading);
        if (isLoading) {
            setShouldShowSkeleton(true);
        }
    }

    useEffect(() => {
        if (isLoading) {
            startTimeRef.current = Date.now();
        } else if (startTimeRef.current) {
            // Loading finished - Check how much time passed
            const elapsedTime = Date.now() - startTimeRef.current;
            const remainingTime = Math.max(0, minDuration - elapsedTime);

            timeoutRef.current = setTimeout(() => {
                setShouldShowSkeleton(false);
                startTimeRef.current = null;
            }, remainingTime);
        } else {
            timeoutRef.current = setTimeout(() => {
                setShouldShowSkeleton(false);
            }, 0);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isLoading, minDuration]);

    return shouldShowSkeleton;
}