import React, { useState } from 'react';
import {
    HelpCircle, BookOpen, MousePointer2, Image as ImageIcon,
    Layers, Zap, AlertTriangle, ArrowLeft, PlayCircle,
    CheckCircle2, Compass, Sparkles, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const ICON_MAP: Record<string, any> = { MousePointer2, Layers, ImageIcon, Zap };

const DEFAULT_GUIDES = [
    { icon: 'MousePointer2', title: "Editing Content", description: "Modify any text, button, or link directly on the canvas with immediate visual feedback.", steps: ["Click any component to select it", "Use the floating toolbar for settings", "Double-click text to edit inline", "Hit Enter or Esc to finish editing"] },
    { icon: 'Layers', title: "Layout Basics", description: "Build your page structure using premium pre-designed sections and modular blocks.", steps: ["Drag new sections from the sidebar", "Reorder layers via the Layers panel", "Adjust section padding and height", "Hide specific blocks on mobile devices"] },
    { icon: 'ImageIcon', title: "Media & Logo", description: "Manage your brand assets with our intelligent diagnostic-aware upload system.", steps: ["Upload PNG, JPG, or SVG logos", "Ensure dimensions are at least 512px", "Verify image integrity via diagnostics", "Browse your gallery for existing assets"] },
    { icon: 'Zap', title: "Saving & Publishing", description: "Ready to go live? Learn how to stage your changes and publish to your domain.", steps: ["Builder auto-saves your progress", "Preview across Mobile, Tablet, Desktop", "Click Publish to deploy changes", "Review SEO and Social meta tags"] }
];

const ACCENT = '#F1D592';
const DARK = '#050505';

const SectionCard = ({ icon: Icon, title, description, steps }: any) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: '#0a0a0a',
                borderRadius: 20,
                padding: 24,
                border: `1px solid ${isHovered ? 'rgba(241, 213, 146, 0.4)' : '#1A1A1A'}`,
                boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : 'none',
                transition: 'all 0.3s ease'
            }}
        >
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: isHovered ? ACCENT : '#1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                transition: 'all 0.3s ease'
            }}>
                <Icon size={24} color={isHovered ? '#FFFFFF' : ACCENT} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>{title}</h3>
            <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, marginBottom: 20 }}>{description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {steps.map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'rgba(241, 213, 146, 0.1)',
                            color: ACCENT,
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                            flexShrink: 0
                        }}>
                            {i + 1}
                        </div>
                        <span style={{ fontSize: 13, color: '#D4D4D8', fontWeight: 500 }}>{step}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export const BuilderHelpPage: React.FC = () => {
    const navigate = useNavigate();
    const [pageData, setPageData] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchPage = async () => {
            const { data } = await supabase
                .from('store_pages')
                .select('*')
                .eq('slug', 'how-to-build')
                .maybeSingle();
            if (data && data.content) setPageData(data.content);
        };
        fetchPage();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: DARK,
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 60 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#0a0a0a',
                            border: '1px solid #1A1A1A',
                            borderRadius: 12,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#A1A1AA',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Builder
                    </button>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{
                            background: '#0a0a0a',
                            border: '1px solid #1A1A1A',
                            borderRadius: 12,
                            padding: '10px 20px',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#F9F9F9',
                            cursor: 'pointer'
                        }}>
                            Documentation
                        </button>
                    </div>
                </div>

                {/* Hero Section */}
                <div style={{ textAlign: 'center', marginBottom: 80 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(241, 213, 146, 0.1)',
                            padding: '8px 16px',
                            borderRadius: 100,
                            color: ACCENT,
                            fontSize: 12,
                            fontWeight: 800,
                            marginBottom: 24,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            <Sparkles size={14} /> Comprehensive Guide
                        </div>
                        <h1 style={{
                            fontSize: 48,
                            fontWeight: 900,
                            color: '#FFFFFF',
                            marginBottom: 20,
                            letterSpacing: '-0.02em'
                        }}>
                            {pageData?.hero?.title || 'Master the Omnora Builder'}
                        </h1>
                        <p style={{
                            fontSize: 18,
                            color: '#A1A1AA',
                            maxWidth: 600,
                            margin: '0 auto 40px',
                            lineHeight: 1.6
                        }}>
                            {pageData?.hero?.subtitle || 'Everything you need to know about designing, customizing, and publishing your premium store.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                            <button
                                onClick={() => {
                                    if (!localStorage.getItem('token')) {
                                        navigate('/login');
                                    } else {
                                        navigate('/seller?tab=builder&tour=true');
                                    }
                                }}
                                style={{
                                    background: ACCENT,
                                    color: DARK,
                                    border: 'none',
                                    borderRadius: 14,
                                    padding: '16px 32px',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    boxShadow: '0 10px 20px -5px rgba(241, 213, 146, 0.2)'
                                }}
                            >
                                <PlayCircle size={20} /> Start Interactive Tour
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Guide Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 32,
                    marginBottom: 80
                }}>
                    {(pageData?.guideGrid || DEFAULT_GUIDES).map((item: any, i: number) => (
                        <SectionCard
                            key={i}
                            icon={ICON_MAP[item.icon] || MousePointer2}
                            title={item.title}
                            description={item.description}
                            steps={item.steps}
                        />
                    ))}
                </div>

                {/* Common Mistakes */}
                <div style={{
                    background: '#0a0a0a',
                    borderRadius: 24,
                    padding: 40,
                    border: '1px solid #1A1A1A',
                    marginBottom: 80
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <AlertTriangle color="#F59E0B" size={24} />
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>Common Mistakes</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 40 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flexShrink: 0, marginTop: 4 }}><X color="#EF4444" size={18} /></div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Low Resolution Assets</h4>
                                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.5 }}>
                                    Using images smaller than 256px will result in blurry displays on high-density screens. Always aim for 512px or larger.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flexShrink: 0, marginTop: 4 }}><X color="#EF4444" size={18} /></div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Overcrowded Viewports</h4>
                                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.5 }}>
                                    Don't forget to check mobile view. If a section looks too busy, use the "Hide on Mobile" toggle to keep it clean.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flexShrink: 0, marginTop: 4 }}><X color="#EF4444" size={18} /></div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Extreme Aspect Ratios</h4>
                                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.5 }}>
                                    Very wide or very tall logos can become illegible in standard headers. Try to use a balanced container.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flexShrink: 0, marginTop: 4 }}><X color="#EF4444" size={18} /></div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Unsaved Drafts</h4>
                                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.5 }}>
                                    While the builder auto-saves locally, you must click 'Publish' to make those changes visible to your customers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    borderTop: '1px solid #1A1A1A'
                }}>
                    <BookOpen size={32} color={ACCENT} style={{ marginBottom: 16 }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Still need help?</h2>
                    <p style={{ color: '#A1A1AA', marginBottom: 32 }}>Our support team is available 24/7 to help you build the perfect store.</p>
                    <button style={{
                        background: '#0a0a0a',
                        border: '1px solid #1A1A1A',
                        borderRadius: 12,
                        padding: '12px 24px',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#F9F9F9',
                        cursor: 'pointer'
                    }}>
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};
