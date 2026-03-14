/**
 * FAQAccordion: Interactive FAQ Section
 *
 * Smooth expand/collapse with optional multi-open mode.
 * Each item has animated height transition.
 * Registered in BuilderRegistry as 'faq_accordion'.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FAQItem {
    question: string;
    answer: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FAQAccordionProps {
    nodeId: string;
    title?: string;
    themeColor?: string;
    bgColor?: string;
    allowMultipleOpen?: boolean;
    items?: FAQItem[];
    children?: React.ReactNode;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_ITEMS: FAQItem[] = [
    { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return policy. If you are not satisfied with your purchase, simply return it in its original condition for a full refund or exchange.' },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available at checkout for an additional fee. Free shipping on all orders over $50.' },
    { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide. International shipping typically takes 10-15 business days. Customs duties and taxes may apply depending on your location.' },
    { question: 'How can I track my order?', answer: 'Once your order ships, you will receive a confirmation email with a tracking number. You can use this number on our website or the carrier\'s website to track your package in real-time.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secured with 256-bit SSL encryption.' },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
    nodeId,
    title = 'Frequently Asked Questions',
    themeColor = '#7c6dfa',
    bgColor = 'transparent',
    allowMultipleOpen = false,
    items = DEFAULT_ITEMS,
}) => {
    const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

    const toggle = useCallback((index: number) => {
        setOpenIndices(prev => {
            const next = new Set(allowMultipleOpen ? prev : []);
            if (prev.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, [allowMultipleOpen]);

    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '32px 0',
                background: bgColor,
            }}
        >
            {title && (
                <h2 style={{
                    fontSize: 22, fontWeight: 800, color: T.text,
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
                {items.map((item, i) => (
                    <AccordionItem
                        key={i}
                        item={item}
                        isOpen={openIndices.has(i)}
                        onToggle={() => toggle(i)}
                        themeColor={themeColor}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Accordion Item ───────────────────────────────────────────────────────────

const AccordionItem: React.FC<{
    item: FAQItem; isOpen: boolean; onToggle: () => void; themeColor: string;
}> = ({ item, isOpen, onToggle, themeColor }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen]);

    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${isOpen ? themeColor + '40' : T.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}>
            <button
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
                    fontSize: 18, color: themeColor,
                    transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                    flexShrink: 0, fontWeight: 300,
                }}>
                    +
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
                    {item.answer}
                </div>
            </div>
        </div>
    );
};

export default FAQAccordion;
