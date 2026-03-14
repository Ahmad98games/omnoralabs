import React, { createContext, useContext } from 'react';

export type OmnoraMode = 'edit' | 'preview' | 'production';
export { BindingResolver } from '../../hooks/BindResolver';

/**
 * OmnoraBaseContext: The "Brutally Small" Core.
 * This is the ONLY context the pure rendering engine and production storefront
 * are allowed to depend on.
 */
export interface OmnoraBaseContextType {
    mode: OmnoraMode;
    viewport: 'desktop' | 'tablet' | 'mobile';
    nodes: Record<string, any>;
}

/**
 * OmnoraEditorExtensions: Builder-only capabilities.
 * These are injected via the BuilderProvider but should be accessed 
 * via optional chaining in components.
 */
export interface OmnoraEditorExtensions {
    selectNode?: (id: string | null) => void;
    updateNode?: (id: string, path: string, value: any) => void;
    selectedNodeId?: string | null;
    isBuilderActive?: boolean;
    setIsTyping?: (typing: boolean) => void;
    setEditingInfo?: (info: any) => void;
    editingInfo?: any;
    commitHistory?: () => void;
    diagnostics?: any;
    setDiagnostics?: (diagnostics: any) => void;
    setLibraryState?: (state: any) => void;
}

export type OmnoraContextType = OmnoraBaseContextType & OmnoraEditorExtensions;

export const OmnoraContext = createContext<OmnoraContextType | null>(null);

/**
 * useOmnora: The primary hook for all Omnora components.
 * Components should use optional chaining for editor-only methods.
 */
export const useOmnora = () => {
    const context = useContext(OmnoraContext);
    if (!context) {
        // Fallback for zero-context environments (SSR, Test, Isolated blocks)
        return {
            mode: 'production' as OmnoraMode,
            viewport: 'desktop' as const,
            nodes: {}
        };
    }
    return context;
};

/**
 * useOmnoraBase: Strict hook for pure rendering logic that must NOT
 * touch editor state.
 */
export const useOmnoraBase = (): OmnoraBaseContextType => {
    const { mode, viewport, nodes } = useOmnora();
    return { mode, viewport, nodes };
};

export const OmnoraRuntimeProvider: React.FC<{
    value: OmnoraContextType;
    children: React.ReactNode
}> = React.memo(({ value, children }) => {
    return (
        <OmnoraContext.Provider value={value}>
            {children}
        </OmnoraContext.Provider>
    );
});
