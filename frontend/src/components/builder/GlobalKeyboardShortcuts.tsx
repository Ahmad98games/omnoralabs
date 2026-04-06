import React, { useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';

/**
 * ⌨️ GlobalKeyboardShortcuts
 * Centralized listener for designer-level keyboard interactions (Undo, Redo, Delete).
 */
export const GlobalKeyboardShortcuts: React.FC = () => {
    const { undo, redo, canUndo, canRedo, selectedNodeId, deleteNode } = useBuilder();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Undo: Ctrl/Cmd + Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                if (canUndo) {
                    e.preventDefault();
                    undo();
                }
            }

            // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
            if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
                ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
                if (canRedo) {
                    e.preventDefault();
                    redo();
                }
            }

            // Delete: Backspace or Delete on selected node
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedNodeId) {
                // Ensure we don't catch backspace accidentally
                e.preventDefault();
                deleteNode(selectedNodeId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo, selectedNodeId, deleteNode]);

    return null; // Side-effect only component
};
