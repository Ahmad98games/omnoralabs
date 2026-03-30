import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
    mode: 'light' | 'dark';
    toggleTheme: () => void;
    etherealGlow: boolean;
    setEtherealGlow: (v: boolean) => void;
    updateSellerStyles: (styles: Record<string, string | number>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark'>('dark');
    const [etherealGlow, setEtherealGlow] = useState(true);

    const [sellerStyles, setSellerStyles] = useState<Record<string, string | number> | null>(null);

    const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    const updateSellerStyles = useCallback((styles: Record<string, string | number>) => setSellerStyles(styles), []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', mode);
        if (etherealGlow) {
            document.documentElement.classList.add('ethereal-enabled');
        } else {
            document.documentElement.classList.remove('ethereal-enabled');
        }

        if (sellerStyles) {
            const root = document.documentElement;
            // Sovereign Builder (Shopify-style) Support
            const primary = sellerStyles.primary || sellerStyles.primaryColor;
            const secondary = sellerStyles.secondary || sellerStyles.accentColor;

            if (primary) {
                root.style.setProperty('--royal-blue', String(primary));
                root.style.setProperty('--glow-color', `${primary}4D`); // 30% opacity
            }
            if (secondary) {
                root.style.setProperty('--gold', String(secondary));
            }

            if (sellerStyles.fontFamilyHeading) root.style.setProperty('--font-serif', String(sellerStyles.fontFamilyHeading));
            if (sellerStyles.fontFamilyBody) root.style.setProperty('--font-sans', String(sellerStyles.fontFamilyBody));
        }
    }, [mode, etherealGlow, sellerStyles]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, etherealGlow, setEtherealGlow, updateSellerStyles }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
