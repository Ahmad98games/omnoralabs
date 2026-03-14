import { useState, useCallback, useEffect } from 'react';

type FrictionType = 'misclick' | 'drag' | 'validation' | 'abandoned_media' | null;

interface InteractionState {
    misclickCount: number;
    invalidDragAttempts: number;
    repeatedValidationErrors: number;
    abandonedMediaActions: number;
    lastFrictionType: FrictionType;
    lastSuggestionTimestamp: number;
    isDismissed: boolean;
    startTime: number;
}

// Global singleton to persist across hook mounts
let globalState: InteractionState = {
    misclickCount: 0,
    invalidDragAttempts: 0,
    repeatedValidationErrors: 0,
    abandonedMediaActions: 0,
    lastFrictionType: null,
    lastSuggestionTimestamp: 0,
    isDismissed: false,
    startTime: Date.now(),
};

const listeners = new Set<(state: InteractionState) => void>();

const notify = () => {
    listeners.forEach((listener) => listener({ ...globalState }));
};

export const useBuilderInteractionStore = () => {
    const [state, setState] = useState<InteractionState>(globalState);

    useEffect(() => {
        listeners.add(setState);
        return () => {
            listeners.delete(setState);
        };
    }, []);

    const recordFriction = useCallback((type: FrictionType) => {
        if (globalState.isDismissed) return;

        switch (type) {
            case 'misclick':
                globalState.misclickCount++;
                break;
            case 'drag':
                globalState.invalidDragAttempts++;
                break;
            case 'validation':
                globalState.repeatedValidationErrors++;
                break;
            case 'abandoned_media':
                globalState.abandonedMediaActions++;
                break;
        }

        globalState.lastFrictionType = type;
        notify();
    }, []);

    const dismissSuggestion = useCallback(() => {
        globalState.isDismissed = true;
        globalState.lastSuggestionTimestamp = Date.now();
        notify();
    }, []);

    const resetFriction = useCallback(() => {
        globalState.misclickCount = 0;
        globalState.invalidDragAttempts = 0;
        globalState.repeatedValidationErrors = 0;
        globalState.abandonedMediaActions = 0;
        globalState.lastFrictionType = null;
        notify();
    }, []);

    const setSuggestionShown = useCallback(() => {
        globalState.lastSuggestionTimestamp = Date.now();
        resetFriction();
        notify();
    }, [resetFriction]);

    const shouldShowSuggestion = (): boolean => {
        const now = Date.now();
        const timeInBuilder = now - globalState.startTime;

        // Rules:
        // 1. Minimum 60 seconds in builder
        if (timeInBuilder < 60000) return false;

        // 2. Not dismissed in current session (or wait 15 mins)
        if (globalState.isDismissed && now - globalState.lastSuggestionTimestamp < 15 * 60000) return false;

        // 3. Thresholds
        if (globalState.misclickCount >= 3) return true;
        if (globalState.invalidDragAttempts >= 2) return true;
        if (globalState.repeatedValidationErrors >= 2) return true;
        if (globalState.abandonedMediaActions >= 3) return true;

        return false;
    };

    return {
        state,
        recordFriction,
        dismissSuggestion,
        resetFriction,
        setSuggestionShown,
        shouldShowSuggestion,
    };
};
