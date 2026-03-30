import React, { useState, useMemo } from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { slugify, validateSlug } from '../../utils/slugify';
import { cloneNodeTree } from '../../utils/nodeCloner';
import { toast } from 'react-hot-toast';
import { NewPageInitializer } from '../../lib/kernel/utils/NewPageInitializer';

interface AddPageModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onAdd?: (title: string, slug: string, type: string, templateData: Record<string, unknown>) => void;
    existingPages?: Record<string, unknown>;
}

type TemplateType = 'blank' | 'product_detail' | 'about_contact' | 'duplicate';

export const AddPageModal: React.FC<AddPageModalProps> = ({ isOpen = true, onClose, onAdd, existingPages }) => {
    // OSTT FIX: Uses zustand store directly instead of complex nested context
    const storePages = useBuilderStore(state => state.pages);
    const pages = useMemo(() => storePages || {}, [storePages]);
    const addPage = useBuilderStore(state => state.addPage);
    const storeNodes = useBuilderStore(state => state.nodes);
    const nodes = useMemo(() => storeNodes || {}, [storeNodes]);

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [template, setTemplate] = useState<TemplateType>('blank');
    const [duplicatePageId, setDuplicatePageId] = useState('');
    
    const existingSlugs = useMemo(() => {
        if (existingPages) return Object.keys(existingPages);
        return Object.values(pages).map(p => p.slug);
    }, [pages, existingPages]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        setSlug(slugify(val));
    };

    const generateTemplateData = (type: TemplateType) => {
        const now = Date.now();
        if (type === 'blank') {
            return NewPageInitializer.generateBlankAST();
        }
        if (type === 'product_detail') {
            const hId = `node_herobanner_${now}_1`;
            const gId = `node_productgrid_${now}_2`;
            const wId = `node_whatsappfloating_${now}_3`;
            const templateNodes = {
                [hId]: { id: hId, type: 'HeroBanner', parentId: null, children: [], props: { title: "Exclusive Products", subtitle: "Handpicked Premium Quality" }, styles: {} },
                [gId]: { id: gId, type: 'ProductGrid', parentId: null, children: [], props: { desktopColumns: 3 }, styles: {} },
                [wId]: { id: wId, type: 'WhatsAppFloating', parentId: null, children: [], props: { phoneNumber: '+92', welcomeMessage: "Hi! Interested." }, styles: {} }
            };
            return { nodes: templateNodes, layout: [hId, gId, wId] };
        }
        if (type === 'about_contact') {
            const tId = `node_trustbadges_${now}_1`;
            const hId = `node_herobanner_${now}_2`;
            const templateNodes = {
                [tId]: { id: tId, type: 'TrustBadges', parentId: null, children: [], props: { items: ["Fast Delivery", "24/7 Support", "Original Guarantee"] }, styles: {} },
                [hId]: { id: hId, type: 'HeroBanner', parentId: null, children: [], props: { title: "About Us", subtitle: "Our story and vision." }, styles: {} }
            };
            return { nodes: templateNodes, layout: [tId, hId] };
        }
        if (type === 'duplicate' && duplicatePageId) {
            // OSTT FIX: Extract layout by finding root nodes
            const layout = (nodes[duplicatePageId] || [])
                .filter(n => n.parentId === null)
                .map(n => n.id);
            const allNodesObj = (nodes[duplicatePageId] || []).reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
            return cloneNodeTree(layout, allNodesObj);
        }
        return undefined;
    };

    const handleSubmit = () => {
        if (!title.trim() || !slug.trim()) {
            return toast.error("Title and Slug are required.");
        }

        if (!validateSlug(slug, existingSlugs)) {
            return toast.error("Slug already exists. Choose a unique name.");
        }

        const templateData = generateTemplateData(template);

        if (!templateData || !templateData.nodes || Object.keys(templateData.nodes).length === 0) {
            console.error('[AddPageModal] BLOCKED: Attempted to save layout with null AST nodes.');
            return toast.error("System Error: Template contains null AST array. Action blocked.");
        }

        if (onAdd) {
            onAdd(title, slug, 'custom', templateData as Record<string, unknown>);
        } else if (addPage) {
            // Internal store relies on global AST commit, we just trigger page creation
            addPage(title, 'custom');
        } else {
            console.error('[AddPageModal] No addPage function provided.');
            return toast.error("Configuration Error: Unable to create page.");
        }
        toast.success(`Page "${title}" created successfully!`);
        onClose();
        setTitle(''); setSlug(''); setTemplate('blank'); setDuplicatePageId('');
    };

    if (!isOpen) return null;

    return (
        <div style={S_Backdrop}>
            <div style={S_Modal}>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Add New Page</h3>

                <div style={S_Field}>
                    <label style={S_Label}>Page Title</label>
                    <input value={title} onChange={handleTitleChange} placeholder="e.g., Summer Collection" style={S_Input} />
                </div>

                <div style={S_Field}>
                    <label style={S_Label}>Slug</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px' }}>
                        <span style={{ padding: '0 10px', color: '#52525b', fontSize: '12px' }}>/</span>
                        <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} style={{ ...S_Input, border: 'none', background: 'transparent', paddingLeft: 0 }} />
                    </div>
                </div>

                <div style={S_Field}>
                    <label style={S_Label}>Starting Template</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {Options.map(opt => (
                            <div 
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') setTemplate(opt.id as TemplateType) }}
                                key={opt.id} 
                                onClick={() => setTemplate(opt.id as TemplateType)}
                                style={S_Thumb(template === opt.id)}
                            >
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.icon}</div>
                                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>{opt.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {template === 'duplicate' && (
                    <div style={S_Field}>
                        <label style={S_Label}>Select Page to Clone</label>
                        <select 
                            value={duplicatePageId} 
                            onChange={(e) => setDuplicatePageId(e.target.value)}
                            style={S_Input}
                        >
                            <option value="">-- Choose Page --</option>
                            {Object.values(pages).map((p: unknown) => {
                                const page = p as { id: string; title: string; slug: string };
                                return (
                                    <option key={page.id} value={page.id}>{page.title} ({page.slug})</option>
                                );
                            })}
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                    <button type="button" onClick={handleSubmit} style={S_Btn('#6366f1')}>Create Page</button>
                    <button type="button" onClick={onClose} style={S_Btn('#27272a')}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const Options = [
    { id: 'blank', label: 'Blank Page', icon: '📄' },
    { id: 'product_detail', label: 'Product Detail', icon: '🛍️' },
    { id: 'about_contact', label: 'About/Contact', icon: '🤝' },
    { id: 'duplicate', label: 'Clone Existing', icon: '👯' },
];

const S_Backdrop: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
};

const S_Modal: React.CSSProperties = {
    background: '#121214', padding: '24px', borderRadius: '12px', width: '420px',
    border: '1px solid #1a1a1b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
};

const S_Field: React.CSSProperties = { marginBottom: '14px' };
const S_Label: React.CSSProperties = { display: 'block', color: '#a1a1aa', fontSize: '12px', marginBottom: '6px', fontWeight: 500 };
const S_Input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#09090b', color: '#fff', border: '1px solid #27272a',
    borderRadius: '6px', fontSize: '13px', outline: 'none'
};

const S_Thumb = (active: boolean): React.CSSProperties => ({
    padding: '16px', background: active ? '#18181b' : '#09090b', border: `1px solid ${active ? '#6366f1' : '#27272a'}`,
    borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
});

const S_Btn = (bg: string): React.CSSProperties => ({
    flex: 1, padding: '10px', background: bg, color: '#fff', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
});