import React, { useMemo } from 'react';
import { OmnoraRenderer } from '../components/cms/OmnoraRenderer';

/**
 * StorefrontTestPage: The Ultimate Portability Test.
 * 
 * OS.REALITY_CHECK: This page does NOT import BuilderProvider.
 * It renders a hardcoded serialized state to prove the engine is decoupled.
 */
const StorefrontTestPage: React.FC = () => {
    // 1. Hardcoded Serialized State (Simulating a database load)
    const mockState = useMemo(() => ({
        nodes: {
            "hero_01": {
                id: "hero_01",
                type: "HeroSection",
                children: ["text_01", "btn_01"],
                props: {
                    title: "Decoupled Reality",
                    subtitle: "This page renders without a single line of Builder logic.",
                    align: "center",
                    accentColor: "#7c6dfa"
                },
                styles: { padding: "120px 0" }
            },
            "text_01": {
                id: "text_01",
                type: "EditableText", // This might need a registry entry that works in pure mode
                parentId: "hero_01",
                children: [],
                props: { text: "Platform Evolution in Progress", tag: "h2" }
            },
            "btn_01": {
                id: "btn_01",
                type: "Button",
                parentId: "hero_01",
                children: [],
                props: { label: "Learn More", variant: "primary" }
            }
        },
        layout: ["hero_01"]
    }), []);

    return (
        <div className="storefront-runtime-shim" style={{ background: '#030304', minHeight: '100vh', color: '#fff' }}>
            <header style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', opacity: 0.5 }}>
                    OMNORA STOREFRONT RUNTIME (DECOUPLED)
                </span>
            </header>

            <main>
                <OmnoraRenderer
                    blocks={mockState.layout}
                    mode="production"
                />
            </main>

            <footer style={{ padding: '40px', textAlign: 'center', opacity: 0.3, fontSize: 11 }}>
                &copy; 2026 Omnora Core Engine. Zero Context Leakage.
            </footer>
        </div>
    );
};

export default StorefrontTestPage;
