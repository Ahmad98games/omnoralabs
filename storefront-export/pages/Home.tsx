import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  CreditCard,
  HeadphonesIcon
} from 'lucide-react';
import client from '../api/client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../styles/Home.css';

import { useStorefront } from '../hooks/useStorefront';
import { DynamicSection } from '../components/DynamicSection';
import { BuilderProvider } from '../context/BuilderContext';
import { DiagnosticsPanel } from '../components/cms/DiagnosticsPanel';
// import SovereignWidget from '../components/cms/SovereignWidget';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

export default function Home() {
  // ─── ALL HOOKS FIRST — no conditional returns before this block ───────────
  const { content: siteContent, loading: cmsLoading } = useStorefront();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRefs = useRef<(HTMLElement | null)[]>([]);

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
  // ─────────────────────────────────────────────────────────────────────────

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  // ─── CMS Loading skeleton — safe to return AFTER all hooks ───────────────
  if (cmsLoading) {
    return (
      <div className="home-sovereign-morph" style={{ background: '#030304', minHeight: '100vh', padding: '2rem' }}>
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

  // builder mode detection
  const isPreview = window.location.search.includes('preview=true');

  // RESOLVE ACTIVE PAGE SLUG
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pageSlug = pathParts.length > 2 ? pathParts[2] : 'home';

  const activePageData = siteContent?.pages?.[pageSlug];
  const activeLayout = activePageData?.layout || (pageSlug === 'home' ? siteContent?.layout : null);

  if (activeLayout && activeLayout.length > 0) {
    return (
      <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
        <div className="home-sovereign-morph">
          <DynamicSection blocks={activeLayout} />
          <DiagnosticsPanel />
          {/* <SovereignWidget /> */}
        </div>
      </BuilderProvider>
    );
  }

  // Fallback: slug requested but no page data found
  if (pageSlug !== 'home' && !activePageData) {
    return (
      <div className="container py-20 text-center">
        <h2 className="h2 subtitle-serif">Page Not Found</h2>
        <p className="text-muted">The requested territory has not been materialized.</p>
        <Link to={`/store/${pathParts[1]}`} className="btn btn-primary mt-8">BACK TO STORE</Link>
      </div>
    );
  }

  // ─── Hard-coded home fallback (always renders when no CMS layout exists) ──
  return (
    <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
      <div className="home-rebuild">
        <DiagnosticsPanel />
        {/* ================= HERO ================= */}
        <section
          className="master-hero"
          style={{
            padding: siteContent?.configuration?.ui?.spatialPadding || 'clamp(3rem, 8vw, 6rem) 0',
            backgroundImage: siteContent?.pages?.home?.heroImage
              ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${siteContent.pages.home.heroImage})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="container hero-inner reveal" ref={addToRefs}>
            <span className="hero-eyebrow">{siteContent?.pages?.home?.eyebrow || 'PAKISTANI PREMIUM WEAR'}</span>

            <h1 className="h1 hero-title">
              {siteContent?.pages?.home?.headlineText ? (
                siteContent.pages.home.headlineText.split('<br />').map((line: string, i: number) => (
                  <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
                ))
              ) : (
                <>Designed for Elegance <br />
                  <span className="font-serif italic font-light text-blush">
                    Crafted for Confidence
                  </span></>
              )}
            </h1>

            <p className="hero-description">
              {siteContent?.pages?.home?.subtext || `Experience the finest unstitched, ready-to-wear, and formal collections,
              crafted with precision from Pakistan's most premium fabrics.`}
            </p>

            <div className="hero-actions">
              <Link to="/collection" className="btn btn-primary btn-luxury">
                {siteContent?.pages?.home?.ctaText || 'Shop Collection'}
                <ArrowRight size={18} className="ml-2" />
              </Link>

              <Link to="/collection?category=unstitched" className="btn btn-glass">
                Explore Fabrics
              </Link>
            </div>
          </div>
        </section>

        {/* ================= MOSAIC ================= */}
        <section className="section-padding container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="h2 subtitle-serif">The Collections</h2>
            <div className="accent-bar" />
          </div>

          <div className="category-mosaic reveal" ref={addToRefs}>
            <Link to="/collection?category=unstitched" className="mosaic-card reveal-up" ref={addToRefs}>
              <div className="mosaic-img-wrapper">
                <img src="/images/home/unstitched.png" alt="Unstitched" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <div className="mosaic-fallback">FABRIC</div>
              </div>
              <div className="mosaic-overlay">
                <h3 className="mosaic-title">Unstitched</h3>
                <p className="mosaic-sub">Luxury seasonal fabrics for custom tailoring</p>
              </div>
            </Link>

            <div className="mosaic-stack">
              <Link to="/collection?category=stitched" className="mosaic-card light reveal-left" ref={addToRefs}>
                <div className="mosaic-img-wrapper">
                  <img src="/images/home/ready-to-wear.png" alt="Ready to Wear" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <div className="mosaic-fallback">STITCHED</div>
                </div>
                <div className="mosaic-overlay">
                  <h3 className="mosaic-title">Ready-to-Wear</h3>
                  <p className="mosaic-sub">Tailored fits for everyday elegance</p>
                </div>
              </Link>

              <Link to="/collection?category=formal" className="mosaic-card reveal-right" ref={addToRefs}>
                <div className="mosaic-img-wrapper">
                  <img src="/images/home/formal.png" alt="Formal" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <div className="mosaic-fallback">EVENING</div>
                </div>
                <div className="mosaic-overlay">
                  <h3 className="mosaic-title">Formal</h3>
                  <p className="mosaic-sub">Statement pieces for special occasions</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= FEATURED ================= */}
        {(loading || featured.length > 0) && (
          <section className="section-padding container">
            <div className="section-header-split reveal" ref={addToRefs}>
              <div>
                <h2 className="h2 subtitle-serif">New Arrivals</h2>
                <p className="text-muted italic">The latest additions to our atelier</p>
              </div>
              <Link to="/collection" className="text-gold letter-spacing-wide font-bold xsmall">
                VIEW ALL
              </Link>
            </div>

            <div className="grid-2-mobile reveal" ref={addToRefs}>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <Skeleton height={420} borderRadius={0} />
                    <Skeleton width="60%" height={20} className="mt-4" />
                    <Skeleton width="40%" height={16} />
                  </div>
                ))
                : featured.map((p, idx) => (
                  <Link key={p._id} to={`/product/${p._id}`} className={`product-card reveal-up delay-${idx + 1}`} ref={addToRefs}>
                    <div className="img-wrapper">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="product-img" />
                      ) : (
                        <div className="editorial-placeholder">
                          <span>{p.category || 'PREMIUM'}</span>
                          <span className="placeholder-sep" />
                          <span>DETAIL</span>
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <h3 className="product-name">{p.name}</h3>
                      <p className="product-price">PKR {(p.price || 0).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* ================= VALUES ================= */}
        <section className="section-padding border-t reveal" ref={addToRefs}>
          <div className="container grid-2-mobile text-center">
            {[
              { Icon: Truck, label: 'Nationwide Delivery', sub: '2–4 working days across Pakistan' },
              { Icon: ShieldCheck, label: 'Secure Checkout', sub: 'Encrypted payment processing' },
              { Icon: CreditCard, label: 'Quality First', sub: 'Premium Pakistani fabrics' },
              { Icon: HeadphonesIcon, label: 'Customer Care', sub: 'Human-led support' }
            ].map((item, idx) => (
              <div key={idx} className="pillar reveal-up" ref={addToRefs}>
                <item.Icon className="text-gold mb-4" size={32} strokeWidth={1.5} />
                <h4 className="font-bold letter-spacing-tight mb-2 uppercase xsmall">{item.label}</h4>
                <p className="text-muted xsmall">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* <SovereignWidget /> */}
      </div>
    </BuilderProvider>
  );
}
