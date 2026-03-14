import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  CreditCard,
  HeadphonesIcon,
  Star,
  Quote,
  Play,
  Clock
} from 'lucide-react';
import client from '../api/client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../styles/Home.css';

import { useStorefront } from '../hooks/useStorefront';
import { DynamicSection } from '../components/DynamicSection';
import { BuilderProvider } from '../context/BuilderContext';
import { DiagnosticsPanel } from '../components/cms/DiagnosticsPanel';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

// ==========================================
// REVIEWS DATA (EASILY UPDATABLE)
// ==========================================
const CUSTOMER_REVIEWS = [
    {
        id: 1,
        name: "Sarah Ahmed",
        role: "Verified Buyer",
        rating: 5,
        comment: "Absolutely in love with the unstitched collection. The fabric quality is incredibly premium, and it arrived beautifully packaged. Will definitely be shopping here again!",
        date: "March 2026"
    },
    {
        id: 2,
        name: "Ayesha Khan",
        role: "Regular Customer",
        rating: 5,
        comment: "The ready-to-wear dresses are perfectly tailored. I bought a formal piece for a wedding and received so many compliments. Exceptional service as well.",
        date: "February 2026"
    },
    {
        id: 3,
        name: "Hassan Raza",
        role: "Verified Buyer",
        rating: 5,
        comment: "I purchased a gift for my wife and she was thrilled. The delivery was right on time and the quality exceeded our expectations. Highly recommended.",
        date: "January 2026"
    }
];

export default function Home() {
  const { content: siteContent, loading: cmsLoading } = useStorefront();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRefs = useRef<(HTMLElement | null)[]>([]);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'reviews' | 'features'>('reviews');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await client.get('/products?limit=4');
        const list = res.data?.data || res.data?.products || [];
        setFeatured(list.slice(0, 4));
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Failed to fetch featured products', err);
          setFeatured([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = scrollRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
      observer.disconnect();
    };
  }, [loading, featured]);

  useEffect(() => {
      const handleScroll = () => {
          setScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  if (cmsLoading) {
    return (
      <div className="home-sovereign-morph" style={{ background: '#020202', minHeight: '100vh', padding: '2rem' }}>
        <div className="skeleton-tile" style={{ height: '80vh', width: '100%', marginBottom: '2rem' }}></div>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="skeleton-tile" style={{ height: '300px' }}></div>
            <div className="skeleton-tile" style={{ height: '300px' }}></div>
            <div className="skeleton-tile" style={{ height: '300px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const isPreview = window.location.search.includes('preview=true');

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pageSlug = pathParts.length > 2 ? pathParts[2] : 'home';

  const activePageData = siteContent?.pages?.[pageSlug];
  const activeLayout = activePageData?.layout || (pageSlug === 'home' ? siteContent?.layout : null);

  /*
  if (activeLayout && activeLayout.length > 0) {
    return (
      <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
        <div className="home-sovereign-morph">
          <DynamicSection blocks={activeLayout} />
          <DiagnosticsPanel />
        </div>
      </BuilderProvider>
    );
  }

  if (pageSlug !== 'home' && !activePageData) {
    return (
      <div className="container py-20 text-center">
        <h2 className="h2 subtitle-serif">Page Not Found</h2>
        <p className="text-muted">The requested territory has not been materialized.</p>
        <Link to={`/store/${pathParts[1]}`} className="btn btn-primary mt-8">BACK TO STORE</Link>
      </div>
    );
  }
  */

  return (
    <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
      <div className="min-h-screen bg-[#020202] text-white selection:bg-[#D4AF37]/30 selection:text-white font-sans overflow-x-hidden">
        <DiagnosticsPanel />
        
        {/* --- HERO SECTION ---  */}
        <header className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 scale-105 animate-[slow-pan_20s_ease-in-out_infinite_alternate]">
                <img 
                    src={siteContent?.pages?.home?.heroImage || "https://images.unsplash.com/photo-1550614000-4b95d4ed79fe?q=80&w=2070&auto=format&fit=crop"}
                    alt="E-Commerce Hero" 
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/30 via-transparent to-[#020202]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/80 via-transparent to-[#020202]/40" />
            </div>

            <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-20">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-300 font-medium pt-0.5">{siteContent?.pages?.home?.eyebrow || "The Summer '26 Collection"}</span>
                </div>

                <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-white mb-6 leading-[0.9] tracking-tighter drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    {siteContent?.pages?.home?.headlineText ? (
                        siteContent.pages.home.headlineText.split('<br />').map((line: string, i: number) => (
                          <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
                        ))
                    ) : (
                        <>REDEFINE <br /><span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">Elegance.</span></>
                    )}
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {siteContent?.pages?.home?.subtext || "Artisan-crafted Pakistani formal wear, ready-to-wear, and premium unstitched fabrics tailored for the modern sovereign."}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <button 
                        onClick={() => navigate('collection')}
                        className="group relative px-10 py-5 bg-[#D4AF37] text-black font-extrabold tracking-[0.15em] uppercase text-sm overflow-hidden transition-all hover:scale-105"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {siteContent?.pages?.home?.ctaText || "Discover Now"} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('about')}
                        className="group flex items-center justify-center gap-4 px-10 py-5 border border-white/20 text-white font-bold tracking-wider uppercase text-sm transition-all hover:bg-white/5"
                    >
                        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors">
                            <Play size={12} className="text-white group-hover:text-[#D4AF37] ml-0.5" />
                        </div>
                        Our Story
                    </button>
                </div>
            </div>
        </header>

        {/* --- CURATED EDIT (BENTO GRID) --- */}
        <section className="py-24 bg-[#020202] relative reveal" ref={addToRefs}>
            <div className="container mx-auto px-6 md:px-12 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16">
                    <div className="max-w-xl">
                        <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">The Lookbook</span>
                        <h2 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight">
                            Curated <br/> <span className="italic font-light text-gray-400">Selections.</span>
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[650px]">
                    <div 
                        onClick={() => navigate('collection?category=formal')} 
                        className="md:col-span-8 group cursor-pointer relative rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 h-[400px] md:h-full"
                    >
                        <img 
                            src="/images/home/formal.png" 
                            alt="Formal" 
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1200' }}
                            className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
                        <div className="absolute bottom-0 left-0 p-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <span className="text-white/60 text-xs tracking-[0.2em] uppercase mb-3 block">01 — Category</span>
                            <h3 className="text-4xl md:text-5xl font-serif text-white mb-4">Formal Wear</h3>
                            <p className="text-gray-300 font-light max-w-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Elegant handcrafted pieces for unforgettable evenings.</p>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-6 h-full">
                        <div 
                            onClick={() => navigate('collection?category=unstitched')} 
                            className="flex-1 group cursor-pointer relative rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 min-h-[250px]"
                        >
                            <img 
                                src="/images/home/unstitched.png" 
                                alt="Unstitched" 
                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?q=80&w=800' }}
                                className="absolute inset-0 w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-out opacity-70"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <span className="text-white/60 text-[10px] tracking-[0.2em] uppercase mb-2 block">02 — Premium</span>
                                <h3 className="text-2xl font-serif text-white flex justify-between items-end">
                                    Unstitched
                                    <ArrowRight size={18} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                                </h3>
                            </div>
                        </div>

                        <div 
                            onClick={() => navigate('collection?category=stitched')} 
                            className="flex-1 group cursor-pointer relative rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 min-h-[250px]"
                        >
                            <img 
                                src="/images/home/ready-to-wear.png" 
                                alt="Ready to Wear" 
                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800' }}
                                className="absolute inset-0 w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-out opacity-70"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <span className="text-white/60 text-[10px] tracking-[0.2em] uppercase mb-2 block">03 — Tailored</span>
                                <h3 className="text-2xl font-serif text-white flex justify-between items-end">
                                    Ready to Wear
                                    <ArrowRight size={18} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ================= FEATURED PRODUCTS ================= */}
        {(loading || featured.length > 0) && (
          <section className="py-24 bg-[#020202] container mx-auto px-6 md:px-12 reveal" ref={addToRefs}>
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-4xl font-serif text-white">New Arrivals</h2>
                <p className="text-gray-400 italic">The latest additions to our atelier</p>
              </div>
              <Link to="collection" className="text-[#D4AF37] tracking-[0.2em] uppercase text-xs font-bold hover:text-white transition-colors pb-1 border-b border-[#D4AF37]/30">
                View All Catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {loading
                ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <Skeleton height={420} baseColor="#111" highlightColor="#222" borderRadius={16} />
                  </div>
                ))
                : featured.map((p, idx) => (
                  <div key={p._id} className="group cursor-pointer" onClick={() => navigate(`product/${p._id}`)}>
                    <div className="w-full h-[380px] bg-[#0A0A0A] rounded-xl overflow-hidden mb-4 relative">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-[#111] text-[#222]">NO IMG</div>
                      )}
                    </div>
                    <h3 className="text-white font-medium text-lg leading-tight group-hover:text-[#D4AF37] transition-colors">{p.name}</h3>
                    <p className="text-gray-400 mt-1 font-light">PKR {(p.price || 0).toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* --- THE OMNORA STANDARD (Features + Reviews) --- */}
        <section className="py-32 bg-[#050505] border-t border-white/5 reveal" ref={addToRefs}>
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col items-center justify-center mb-24">
                    <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4">Reputation & Trust</span>
                    <div className="relative inline-flex gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <button 
                            onClick={() => setActiveTab('reviews')}
                            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 ${activeTab === 'reviews' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Customer Voices
                        </button>
                        <button 
                            onClick={() => setActiveTab('features')}
                            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 ${activeTab === 'features' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            The Standard
                        </button>
                        
                        <div 
                            className="absolute top-1.5 bottom-1.5 rounded-full bg-[#D4AF37] transition-all duration-500 ease-spring"
                            style={{
                                left: activeTab === 'reviews' ? '6px' : 'calc(50% + 2px)',
                                width: 'calc(50% - 8px)'
                            }}
                        />
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {/* REVIEWS */}
                    <div className={`transition-all duration-700 w-full ${activeTab === 'reviews' ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-8 invisible absolute'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {CUSTOMER_REVIEWS.map((review, idx) => (
                                <div key={review.id} className="bg-[#0A0A0A] rounded-2xl p-10 border border-white/5 hover:border-[#D4AF37]/30 transition-all flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-1">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star key={i} size={16} className="fill-[#D4AF37] text-[#D4AF37]" />
                                            ))}
                                        </div>
                                        <Quote size={24} className="text-white/10" />
                                    </div>
                                    <p className="text-gray-300 font-light leading-relaxed flex-1 mb-8 text-lg">"{review.comment}"</p>
                                    <div className="pt-6 border-t border-white/5">
                                        <h4 className="text-white font-bold">{review.name}</h4>
                                        <p className="text-[#D4AF37] text-xs uppercase tracking-widest mt-1">{review.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FEATURES */}
                    <div className={`transition-all duration-700 w-full ${activeTab === 'features' ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-8 invisible absolute top-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <div className="p-12 text-center flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
                                <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-8 rotate-3 border border-[#D4AF37]/20"><ShieldCheck size={36} className="text-[#D4AF37] -rotate-3" /></div>
                                <h3 className="text-2xl font-serif text-white mb-4">Premium Quality</h3>
                                <p className="text-gray-400 font-light">Sourced from the finest mills and crafted by master artisans.</p>
                            </div>
                            <div className="p-12 text-center flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
                                <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-8 rotate-3 border border-[#D4AF37]/20"><Truck size={36} className="text-[#D4AF37] -rotate-3" /></div>
                                <h3 className="text-2xl font-serif text-white mb-4">Global Fulfillment</h3>
                                <p className="text-gray-400 font-light">Secure, insured, and expedited shipping worldwide.</p>
                            </div>
                            <div className="p-12 text-center flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
                                <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-8 rotate-3 border border-[#D4AF37]/20"><Clock size={36} className="text-[#D4AF37] -rotate-3" /></div>
                                <h3 className="text-2xl font-serif text-white mb-4">Concierge Support</h3>
                                <p className="text-gray-400 font-light">Our support team is available 24/7 to assist with your bespoke needs.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </BuilderProvider>
  );
}
