import React, { useEffect, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';

/**
 * 💾 AutoSaveManager
 * Encapsulates the periodic synchronization logic between the local designer state
 * and the Supabase persistence layer.
 */
export const AutoSaveManager: React.FC = () => {
    const { hasUnsavedChanges, saveDraft, nodes } = useBuilder();
    const nodesRef = useRef(nodes);

    // Sync ref with state for use in effect
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const timer = setTimeout(async () => {
                   try {
                console.log('[Omnora OS] Auto-syncing Designer Registry...');
                await saveDraft(nodesRef.current);
            } catch (err) {
                console.error('[Omnora OS] Auto-sync Failure:', err);
            }
        }, 15000); // 15-second debounce window

        return () => clearTimeout(timer);
    }, [hasUnsavedChanges, saveDraft]);

    return null; // Side-effect only component
};
