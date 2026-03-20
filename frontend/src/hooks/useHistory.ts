import { useEffect } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';

/**
 * useHistory: Keyboard Bindings for Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
 * 
 * Scoped to ensure it doesn't trigger while typing in Input/Textarea fields.
 */
export const useHistory = () => {
    const { undo, redo, loadHistorySession } = useBuilderStore();

    // 1. Restore history from sessionStorage on mount
    useEffect(() => {
        loadHistorySession();
    }, [loadHistorySession]);

    // 2. Listen for Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input/textarea to avoid hijacking standard undoes
            const activeEl = document.activeElement;
            const isTyping = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                (activeEl as HTMLElement).isContentEditable
            );

            if (isTyping) return;

            const isCtrlOrMeta = e.ctrlKey || e.metaKey;

            if (isCtrlOrMeta && e.key?.toLowerCase() === 'z') {
                e.preventDefault();
                
                if (e.shiftKey) {
                    // Ctrl + Shift + Z => Redo
                    redo();
                } else {
                    // Ctrl + Z => Undo
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);
};
