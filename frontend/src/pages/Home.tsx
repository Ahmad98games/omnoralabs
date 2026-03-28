import React from 'react';
import { useStorefront } from '../hooks/useStorefront';
import { DynamicSection } from '../components/DynamicSection';
import { BuilderProvider } from '../context/BuilderContext';
import { DiagnosticsPanel } from '../components/cms/DiagnosticsPanel';
import { CinematicLoader } from '../components/ui/CinematicLoader';

/**
 * Home: Sovereign Storefront Entry Node
 * 
 * High-performance industrial renderer for Omnora OS.
 * Exclusively utilizes DynamicSection for block-based architecture.
 */
export default function Home() {
  const { content: siteContent, loading: cmsLoading } = useStorefront();
  
  if (cmsLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <CinematicLoader />
      </div>
    );
  }

  const isPreview = window.location.search.includes('preview=true');
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pageSlug = pathParts.length > 2 ? pathParts[2] : 'home';

  const activePageData = siteContent?.pages?.[pageSlug];
  // Prefer page-specific layout, fallback to global layout for home
  const activeLayout = activePageData?.layout || (pageSlug === 'home' ? siteContent?.layout : []);

  return (
    <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 font-sans overflow-x-hidden pt-20">
        <DynamicSection blocks={activeLayout || []} />
        <DiagnosticsPanel />
      </div>
    </BuilderProvider>
  );
}
