import React from 'react';
import { useOmnora } from '../client/OmnoraContext';
import { Logger } from '../core/Logger';

export interface OmnoraLink {
    type: 'url' | 'page' | 'anchor' | 'none';
    url?: string;
    pageId?: string;
    anchorId?: string;
}

interface LinkProps {
    to: OmnoraLink | any;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /**
     * resolveHref: Custom hook to transform OmnoraLink into a string.
     */
    resolveHref?: (link: OmnoraLink) => string;
    /**
     * onNavigate: Async-ready callback for custom navigation logic.
     * Supports Promise return for frameworks with transition handling.
     */
    onNavigate?: (href: string, link: OmnoraLink) => void | Promise<void>;
}

/**
 * LinkResolver: Environment-agnostic navigation component (v4).
 */
export const LinkResolver: React.FC<LinkProps> = ({
    to, children, className, style, resolveHref: customResolve, onNavigate
}) => {
    const { mode } = useOmnora();

    if (!to || to.type === 'none') {
        return <span className={className} style={style}>{children}</span>;
    }

    const defaultResolve = (l: OmnoraLink) => {
        if (l.type === 'url') return l.url || '#';
        if (l.type === 'anchor') return `#${l.anchorId}`;
        if (l.type === 'page') return `?page=${l.pageId}`;
        return '#';
    };

    const href = customResolve ? customResolve(to) : defaultResolve(to);

    const handleClick = async (e: React.MouseEvent) => {
        if (mode === 'edit') {
            e.preventDefault();
            Logger.debug('Navigation blocked in Editor Mode.');
            return;
        }

        if (onNavigate) {
            e.preventDefault();
            try {
                // v4: Async support for navigation transitions
                await Promise.resolve(onNavigate(href, to));
            } catch (err) {
                Logger.error('ASYNC_NAVIGATION_FAILED', err);
            }
        }
    };

    return (
        <a
            href={href}
            className={className}
            style={{
                textDecoration: 'none',
                color: 'inherit',
                ...style
            }}
            onClick={handleClick}
            data-omnora-link-type={to.type}
            data-omnora-page-id={to.pageId}
        >
            {children}
        </a>
    );
};
