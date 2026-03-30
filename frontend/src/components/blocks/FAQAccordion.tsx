import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQAccordionProps {
    nodeId: string;
    title?: string;
    faqs?: FAQItem[];
    defaultOpen?: number;
    allowMultiple?: boolean;
    iconStyle?: 'plus-minus' | 'chevron' | 'arrow';
    borderStyle?: 'full' | 'bottom-only' | 'none';
    headingColor?: string;
    accentColor?: string;
    children?: React.ReactNode;
}

const DEFAULT_ITEMS: FAQItem[] = [
    { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return policy. If you are not satisfied with your purchase, simply return it in its original condition for a full refund or exchange.' },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available at checkout for an additional fee. Free shipping on all orders over $50.' },
    { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide. International shipping typically takes 10-15 business days. Customs duties and taxes may apply depending on your location.' },
    { question: 'How can I track my order?', answer: 'Once your order ships, you will receive a confirmation email with a tracking number. You can use this number on our website or the carrier\'s website to track your package in real-time.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secured with 256-bit SSL encryption.' },
];

const T = {
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
    nodeId,
    title = 'Frequently Asked Questions',
    faqs = DEFAULT_ITEMS,
    defaultOpen = 0,
    allowMultiple = false,
    iconStyle = 'plus-minus',
    borderStyle = 'full',
    headingColor = '#f0f0f5',
    accentColor = '#7c6dfa',
}) => {
    const [openIndices, setOpenIndices] = useState<Set<number>>(new Set(defaultOpen >= 0 ? [defaultOpen] : []));

    const toggle = useCallback((index: number) => {
        setOpenIndices(prev => {
            const next = new Set(allowMultiple ? prev : []);
            if (prev.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, [allowMultiple]);

    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '32px 16px',
            }}
        >
            {title && (
                <h2 style={{
                    fontSize: 22, fontWeight: 800, color: headingColor,
                    margin: '0 0 24px', letterSpacing: '-0.03em',
                    textAlign: 'center',
                }}>
                    {title}
                </h2>
            )}

            <div style={{
                maxWidth: 700, margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                {faqs.map((item, i) => (
                    <AccordionItem
                        key={i}
                        item={item}
                        isOpen={openIndices.has(i)}
                        onToggle={() => toggle(i)}
                        accentColor={accentColor}
                        iconStyle={iconStyle}
                        borderStyle={borderStyle}
                    />
                ))}
            </div>
        </div>
    );
};

const AccordionItem: React.FC<{
    item: FAQItem; 
    isOpen: boolean; 
    onToggle: () => void; 
    accentColor: string;
    iconStyle: 'plus-minus' | 'chevron' | 'arrow';
    borderStyle: 'full' | 'bottom-only' | 'none';
}> = ({ item, isOpen, onToggle, accentColor, iconStyle, borderStyle }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    const isFull = borderStyle === 'full';
    const isBottom = borderStyle === 'bottom-only';

    useEffect(() => {
        // OSTT FIX: Placed inside requestAnimationFrame to run after paint
        if (contentRef.current) {
            const scrollHeight = contentRef.current.scrollHeight;
            requestAnimationFrame(() => {
                setHeight(isOpen ? scrollHeight : 0);
            });
        }
    }, [isOpen]);

    return (
        <div style={{
            background: T.surface,
            border: isFull ? `1px solid ${isOpen ? accentColor + '40' : T.border}` : 'none',
            borderBottom: isBottom ? `1px solid ${T.border}` : undefined,
            borderRadius: isFull ? 12 : 0,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            marginBottom: isFull ? 8 : 0,
        }}>
            <button
                type="button"
                onClick={onToggle}
                style={{
                    width: '100%', padding: '16px 20px',
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', gap: 12,
                }}
            >
                <span style={{
                    fontSize: 14, fontWeight: 600, color: T.text,
                    textAlign: 'left', lineHeight: 1.4,
                }}>
                    {item.question}
                </span>
                <span style={{
                    fontSize: 16, color: accentColor,
                    transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                    transform: isOpen && iconStyle === 'plus-minus' ? 'rotate(45deg)' : isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    flexShrink: 0, fontWeight: 300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {iconStyle === 'plus-minus' ? '+' : iconStyle === 'chevron' ? '▼' : '↓'}
                </span>
            </button>
            <div style={{
                height, overflow: 'hidden',
                transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}>
                <div ref={contentRef} style={{
                    padding: '0 20px 16px',
                    fontSize: 13, color: T.textDim,
                    lineHeight: 1.7, fontWeight: 400,
                }}>
                    {typeof DOMPurify !== 'undefined' ? (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer) }} />
                    ) : item.answer}
                </div>
            </div>
        </div>
    );
};

export default FAQAccordion;