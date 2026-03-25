/**
 * 🛠️ OMNORA LABS | HOME MODULE (KERNEL ENTRY)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

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
import { OmnoraLogger } from '../utils/OmnoraLogger';

/**
 * ENTITY: The fundamental unit of the Omnora Registry.
 */
interface Entity {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

export default function Home() {
  // SYSTEM HYDRATION: Internal state management for kernel boot
  const { content: kernelContent, loading: isKernelLoading } = useStorefront();
  const [stagedEntities, setStagedEntities] = useState<Entity[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const scrollRefs = useRef<(HTMLElement | null)[]>([]);

  /**
   * syncSystemRegistry: Fetches core entities from the persistence layer.
   */
  useEffect(() => {
    const syncSystemRegistry = async () => {
      try {
        setIsHydrating(true);
        OmnoraLogger.info("Syncing system registry with persistent storage...");
        
        const res = await client.get('/products?limit=4');
        const list = res.data?.data || res.data?.products || [];
        
        setStagedEntities(list.slice(0, 4));
        OmnoraLogger.info(`Registry Sync Complete: ${list.length} entities indexed.`);
      } catch (fault: unknown) {
        if (!axios.isCancel(fault)) {
          OmnoraLogger.error("Registry Sync Fault", fault);
          setStagedEntities([]);
        }
      } finally {
        setIsHydrating(false);
      }
    };
    syncSystemRegistry();
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
  }, [isHydrating, stagedEntities]);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  /**
   * HYDRATION_SKELETON: Renders while the kernel is initializing its state.
   */
  if (isKernelLoading) {
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

  const isPreview = window.location.search.includes('preview=true');

  // RESOLVE ACTIVE NAMESPACE
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const namespaceSlug = pathParts.length > 2 ? pathParts[2] : 'home';

  const activeNamespaceData = kernelContent?.pages?.[namespaceSlug];
  const activeLayout = activeNamespaceData?.layout || (namespaceSlug === 'home' ? kernelContent?.layout : null);

  if (activeLayout && activeLayout.length > 0) {
    return (
      <BuilderProvider initialData={kernelContent || {}} isPreview={isPreview}>
        <div className="home-sovereign-morph">
          <DynamicSection blocks={activeLayout} />
          <DiagnosticsPanel />
        </div>
      </BuilderProvider>
    );
  }

  if (namespaceSlug !== 'home' && !activeNamespaceData) {
    return (
      <div className="container py-20 text-center">
        <h2 className="h2 subtitle-serif">Namespace Not Materialized</h2>
        <p className="text-muted">The requested territory has not been provisioned in the registry.</p>
        <Link to={`/store/${pathParts[1]}`} className="btn btn-primary mt-8">RETURN TO KERNEL</Link>
      </div>
    );
  }

  return (
    <BuilderProvider initialData={kernelContent || {}} isPreview={isPreview}>
      <div className="home-rebuild">
        <DiagnosticsPanel />
        
        {/* ================= HERO: SYSTEM OVERLAY ================= */}
        <section
          className="master-hero"
          style={{
            padding: kernelContent?.configuration?.ui?.spatialPadding || 'clamp(3rem, 8vw, 6rem) 0',
            backgroundImage: kernelContent?.pages?.home?.heroImage
              ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${kernelContent.pages.home.heroImage})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="container hero-inner reveal" ref={addToRefs}>
            <span className="hero-eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>
              {kernelContent?.pages?.home?.eyebrow || 'OMNORA_KERNEL::BOOT_SEQUENCE'}
            </span>

            <h1 className="h1 hero-title">
              {kernelContent?.pages?.home?.headlineText ? (
                kernelContent.pages.home.headlineText.split('<br />').map((line: string, i: number) => (
                  <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
                ))
              ) : (
                <>Engineered for Velocity <br />
                  <span className="font-serif italic font-light text-blush">
                    Architected for Scale
                  </span></>
              )}
            </h1>

            <p className="hero-description">
              {kernelContent?.pages?.home?.subtext || `Provisioning the finest modular entities, high-performance kernels, and system configurations,
              orchestrated via the Omnora Labs framework.`}
            </p>

            <div className="hero-actions">
              <Link to="/collection" className="btn btn-primary btn-luxury" style={{ fontFamily: 'var(--font-mono)' }}>
                {kernelContent?.pages?.home?.ctaText || 'INSPECT_REGISTRY'}
                <ArrowRight size={18} className="ml-2" />
              </Link>

              <Link to="/collection?category=unstitched" className="btn btn-glass" style={{ fontFamily: 'var(--font-mono)' }}>
                EXPLORE_NODES
              </Link>
            </div>
          </div>
        </section>

        {/* ================= MOSAIC: REGISTRY NODES ================= */}
        <section className="section-padding container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="h2 subtitle-serif">System Registry</h2>
            <div className="accent-bar" />
          </div>

          <div className="category-mosaic reveal" ref={addToRefs}>
            <Link to="/collection?category=unstitched" className="mosaic-card reveal-up" ref={addToRefs}>
              <div className="mosaic-img-wrapper">
                <img src="/images/home/unstitched.png" alt="Unstitched" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <div className="mosaic-fallback">KERNEL_BASE</div>
              </div>
              <div className="mosaic-overlay">
                <h3 className="mosaic-title">Base Kernels</h3>
                <p className="mosaic-sub">Raw modular foundations for system building</p>
              </div>
            </Link>

            <div className="mosaic-stack">
              <Link to="/collection?category=stitched" className="mosaic-card light reveal-left" ref={addToRefs}>
                <div className="mosaic-img-wrapper">
                  <img src="/images/home/ready-to-wear.png" alt="Ready to Wear" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <div className="mosaic-fallback">ACTIVE_NODE</div>
                </div>
                <div className="mosaic-overlay">
                  <h3 className="mosaic-title">Active Nodes</h3>
                  <p className="mosaic-sub">Pre-configured entities for immediate deployment</p>
                </div>
              </Link>

              <Link to="/collection?category=formal" className="mosaic-card reveal-right" ref={addToRefs}>
                <div className="mosaic-img-wrapper">
                  <img src="/images/home/formal.png" alt="Formal" className="mosaic-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <div className="mosaic-fallback">CLUSTER_PRO</div>
                </div>
                <div className="mosaic-overlay">
                  <h3 className="mosaic-title">High-Tier Clusters</h3>
                  <p className="mosaic-sub">Premium infrastructure for enterprise scale</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= FEATURED: RECENT DEPLOYMENTS ================= */}
        {(isHydrating || stagedEntities.length > 0) && (
          <section className="section-padding container">
            <div className="section-header-split reveal" ref={addToRefs}>
              <div>
                <h2 className="h2 subtitle-serif">Recent Deployments</h2>
                <p className="text-muted italic">Latest entities provisioned for the registry</p>
              </div>
              <Link to="/collection" className="text-royal letter-spacing-wide font-bold xsmall" style={{ fontFamily: 'var(--font-mono)' }}>
                VIEW_ALL_NODES
              </Link>
            </div>

            <div className="grid-2-mobile reveal" ref={addToRefs}>
              {isHydrating
                ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <Skeleton height={420} borderRadius={0} />
                    <Skeleton width="60%" height={20} className="mt-4" />
                    <Skeleton width="40%" height={16} />
                  </div>
                ))
                : stagedEntities.map((entity, idx) => (
                  <Link key={entity._id} to={`/product/${entity._id}`} className={`product-card reveal-up delay-${idx + 1}`} ref={addToRefs}>
                    <div className="img-wrapper">
                      {entity.image ? (
                        <img src={entity.image} alt={entity.name} className="product-img" />
                      ) : (
                        <div className="editorial-placeholder">
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{entity.category || 'NODE::PREMIUM'}</span>
                          <span className="placeholder-sep" />
                          <span style={{ fontFamily: 'var(--font-mono)' }}>METADATA</span>
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <h3 className="product-name">{entity.name}</h3>
                      <p className="product-price" style={{ fontFamily: 'var(--font-mono)' }}>{(entity.price || 0).toLocaleString()} Credits</p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* ================= VALUES: SYSTEM PILLARS ================= */}
        <section className="section-padding border-t reveal" ref={addToRefs}>
          <div className="container grid-2-mobile text-center">
            {[
              { Icon: Truck, label: 'Global Propagation', sub: 'Instant deployment across all nodes' },
              { Icon: ShieldCheck, label: 'Kernel Security', sub: 'End-to-end encrypted logic' },
              { Icon: CreditCard, label: 'Efficiency First', sub: 'High-performance modular assets' },
              { Icon: HeadphonesIcon, label: 'System Support', sub: 'Technical architecture assistance' }
            ].map((pillar, idx) => (
              <div key={idx} className="pillar reveal-up" ref={addToRefs}>
                <pillar.Icon className="text-royal mb-4" size={32} strokeWidth={1.5} />
                <h4 className="font-bold letter-spacing-tight mb-2 uppercase xsmall" style={{ fontFamily: 'var(--font-mono)' }}>{pillar.label}</h4>
                <p className="text-muted xsmall">{pillar.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BuilderProvider>
  );
}
