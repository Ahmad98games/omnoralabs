import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Edit3, Image, Calendar, Eye, Send, Trash2, Plus, Search, ChevronRight, Copy } from 'lucide-react';

export const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activePost, setActivePost] = useState<any>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setPosts(data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        const { data, error } = await supabase
            .from('blog_posts')
            .insert({ title: 'Untitled Post', slug: `new-post-${Date.now()}`, status: 'draft' })
            .select()
            .single();
        if (!error) {
            setActivePost(data);
            setIsEditing(true);
            fetchPosts();
        }
    };

    const handleSave = async () => {
        const { error } = await supabase
            .from('blog_posts')
            .update({ ...activePost, updated_at: new Date().toISOString() })
            .eq('id', activePost.id);
        if (!error) {
            setIsEditing(false);
            fetchPosts();
        }
    };

    const InputStyle = { 
        width: '100%', padding: '12px 16px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 10, color: '#fff', fontSize: '14px', outline: 'none' 
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Blog Engine</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Manage store news, articles, and SEO content</p>
                </div>
                {!isEditing && (
                    <button onClick={handleCreate} style={{ padding: '10px 20px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> New Post
                    </button>
                )}
            </div>

            {isEditing ? (
                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, padding: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Editor: {activePost.title}</h2>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#71717a', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave} style={{ padding: '8px 24px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Send size={16} /> Publish
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
                        {/* Editor Canvas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <input placeholder="Post Title" value={activePost.title} onChange={e => setActivePost({...activePost, title: e.target.value})} style={{ ...InputStyle, fontSize: 32, fontWeight: 800, border: 'none', background: 'transparent', paddingLeft: 0 }} />
                            <div style={{ minHeight: 400, padding: 32, background: '#09090b', border: '1px solid #27272a', borderRadius: 12, color: '#a1a1aa', fontSize: 16, lineHeight: 1.8 }}>
                                {/* TipTap Placeholder */}
                                Start writing your story here...
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                             <div style={{ padding: 24, background: '#09090b', border: '1px solid #27272a', borderRadius: 12 }}>
                                <label style={{ fontSize: 12, color: '#71717a', fontWeight: 700, display: 'block', marginBottom: 12 }}>FEATURED IMAGE</label>
                                <div style={{ height: 160, borderRadius: 8, border: '2px dashed #27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#71717a', fontSize: 12 }}>
                                    <Image size={24} /> Upload Image
                                </div>
                             </div>

                             <div style={{ padding: 24, background: '#09090b', border: '1px solid #27272a', borderRadius: 12 }}>
                                <label style={{ fontSize: 12, color: '#71717a', fontWeight: 700, display: 'block', marginBottom: 16 }}>SETTINGS</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <input placeholder="slug" value={activePost.slug} onChange={e => setActivePost({...activePost, slug: e.target.value})} style={{...InputStyle, fontSize: 12, padding: '8px 12px'}} />
                                    <select value={activePost.status} onChange={e => setActivePost({...activePost, status: e.target.value})} style={{...InputStyle, fontSize: 12, padding: '8px 12px'}}>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                             </div>
                        </aside>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {loading ? (
                        <div style={{ color: '#71717a' }}>Loading posts...</div>
                    ) : posts.map(post => (
                        <div key={post.id} style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ height: 140, background: '#1c1c22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Image size={32} color="#27272a" />
                            </div>
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                     <span style={{ fontSize: 10, color: post.status === 'published' ? '#22c55e' : '#71717a', fontWeight: 800 }}>{post.status.toUpperCase()}</span>
                                     <span style={{ fontSize: 10, color: '#71717a' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{post.title}</h3>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => { setActivePost(post); setIsEditing(true); }} style={{ flex: 1, padding: '8px', background: '#27272a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button style={{ padding: '8px', background: 'transparent', color: '#71717a', border: '1px solid #27272a', borderRadius: 8, cursor: 'pointer' }}><Eye size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
