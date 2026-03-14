import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
    mode: 'light' | 'dark';
    toggleTheme: () => void;
    etherealGlow: boolean;
    setEtherealGlow: (v: boolean) => void;
    updateSellerStyles: (styles: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark'>('dark');
    const [etherealGlow, setEtherealGlow] = useState(true);

    const [sellerStyles, setSellerStyles] = useState<any>(null);

    const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    const updateSellerStyles = useCallback((styles: any) => setSellerStyles(styles), []);

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
                root.style.setProperty('--royal-blue', primary);
                root.style.setProperty('--glow-color', `${primary}4D`); // 30% opacity
            }
            if (secondary) {
                root.style.setProperty('--gold', secondary);
            }

            if (sellerStyles.fontFamilyHeading) root.style.setProperty('--font-serif', sellerStyles.fontFamilyHeading);
            if (sellerStyles.fontFamilyBody) root.style.setProperty('--font-sans', sellerStyles.fontFamilyBody);
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
