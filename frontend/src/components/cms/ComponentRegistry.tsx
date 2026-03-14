import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Lock, EyeOff } from 'lucide-react';
import { useOmnora } from '../../context/OmnoraContext';
import { BuilderNode } from '../../context/BuilderContext';
import { ComponentWrapper } from './ComponentWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useNodeSelector } from '../../hooks/useNodeSelector';

(function injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('omnora-bw-styles')) return;
    const s = document.createElement('style');
    s.id = 'omnora-bw-styles';
    s.textContent = `.builder-active-wrapper{transition:border-color .4s cubic-bezier(.4,0,.2,1);cursor:pointer}.builder-active-wrapper.active{z-index:50}.builder-active-wrapper.locked{cursor:not-allowed}`;
    document.head.appendChild(s);
})();

interface BuilderWrapperProps { nodeId: string; children: React.ReactNode; }

export const BuilderWrapper: React.FC<BuilderWrapperProps> = ({ nodeId, children }) => {
    const { mode, selectNode, selectedNodeId, viewport, isBuilderActive, isTyping } = useOmnora();
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const observerTargetRef = useRef<HTMLDivElement>(null);
    const node = useNodeSelector(nodeId, n => n);

    useEffect(() => {
        const el = observerTargetRef.current;
        if (!el || mode !== 'edit' || !isBuilderActive) return;
        const obs = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { rootMargin: '100% 0px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [mode, isBuilderActive]);

    const activeStyles = useMemo(() => {
        if (!node) return {};
        const base = node.styles || {};
        const responsiveStyles = viewport === 'desktop' ? {} : (node.responsive?.[viewport] || {});
        return { ...base, ...responsiveStyles, contain: 'paint' };
    }, [node, viewport]);

    if (!node) return <>{children}</>;
    const isHiddenOnDevice = node.hidden?.[viewport as keyof typeof node.hidden];

    if (mode !== 'edit' || !isBuilderActive) {
        return <ComponentWrapper nodeId={nodeId} type={node.type} isHidden={isHiddenOnDevice} style={activeStyles} animations={node.animations} animationPreviewKey={node.animationPreviewKey}>{children}</ComponentWrapper>;
    }

    const isDeepLocked = useMemo(() => {
        const visited = new Set<string>();
        let cur: any = node;
        while (cur) {
            if (visited.has(cur.id)) break;
            visited.add(cur.id);
            if (cur.isLocked) return true;
            cur = cur.parent ?? null;
            break;
        }
        return false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeId, node?.revision, node?.isLocked]);

    const isActive = selectedNodeId === nodeId;

    const handleSelect = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDeepLocked || isTyping) return;
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isDeepLocked, isTyping]);

    return (
        <div ref={observerTargetRef} style={{ position: 'relative', overflow: 'visible' }}>
            <ComponentWrapper
                nodeId={nodeId} type={node.type} isHidden={isHiddenOnDevice}
                style={activeStyles}
                animations={node.animations}
                animationPreviewKey={node.animationPreviewKey}
                isBuilderMode={true}
                className={`builder-active-wrapper ${isActive ? 'active' : ''} ${isDeepLocked ? 'locked' : ''}`}
                onClick={handleSelect}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AnimatePresence>
                    {(isHovered || isActive) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                                border: `1.5px solid ${isActive ? '#7c6dfa' : 'rgba(124,109,250,0.25)'}`,
                                boxShadow: isActive ? '0 0 0 3px rgba(124,109,250,0.12)' : 'none',
                                transition: 'border-color 0.3s ease',
                            }}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {(isHovered || isActive) && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                position: 'absolute', top: -12, left: '1rem', zIndex: 11, pointerEvents: 'none',
                                background: isActive ? 'linear-gradient(135deg,#7c6dfa,#9384fb)' : 'rgba(14,14,26,0.92)',
                                backdropFilter: 'blur(12px)',
                                border: `1px solid ${isActive ? 'rgba(124,109,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 5, padding: '3px 9px', color: '#fff',
                                boxShadow: isActive ? '0 2px 12px rgba(124,109,250,0.4)' : '0 2px 8px rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}
                        >
                            {isDeepLocked && <Lock size={10} />}
                            {node.type}
                            {isHiddenOnDevice && <span style={{ fontSize: 8, opacity: 0.6 }}>(HIDDEN)</span>}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="builder-content-container">
                    {(isVisible || isActive) ? children : (
                        <div style={{ padding: 40, textAlign: 'center', opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <EyeOff size={24} />
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{node.type.toUpperCase()} (ASLEEP)</span>
                        </div>
                    )}
                </div>
            </ComponentWrapper>
        </div>
    );
};

export default BuilderWrapper;