import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { isSeller, isAdmin, isInitializing } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isInitializing && (isSeller || isAdmin)) {
      console.log('[Home Proxy] Seller detected, pivoting to Atelier...');
      navigate('/seller/dashboard?tab=builder');
    }
  }, [isInitializing, isSeller, isAdmin, navigate]);
  
  if (cmsLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <CinematicLoader />
      </div>
    );
  }

  const activeLayout = siteContent?.layouts?.home?.blocks || [];

  return (
    <BuilderProvider initialData={siteContent || {}} isPreview={false}>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 font-sans overflow-x-hidden selection:text-black">
        {/* 🏭 INDUSTRIAL HERO: PURE TAILWIND (Task 3.3) */}
        <section className="relative h-[90vh] flex items-center justify-center border-b border-white/10 bg-[#050505]">
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="grid grid-cols-8 h-full w-full opacity-20">
              {Array(64).fill(0).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/5" />
              ))}
            </div>
          </div>
          
          <div className="container relative z-10 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <span className="inline-block px-4 py-1.5 border border-white/10 rounded-full text-[10px] font-black tracking-[0.4em] uppercase bg-black/50 backdrop-blur-md">
                Protocol v3.4 Active
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none uppercase">
                OMNORA <br/>
                <span className="text-white/20">SYSTEMS</span>
              </h1>
              <p className="max-w-xl mx-auto text-sm md:text-base text-white/40 font-medium tracking-tight leading-relaxed">
                Industrial-grade commerce infrastructure. Precision-engineered for the modern operator. 
                Absolute black. Zero compromise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button className="px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all duration-300">
                  Access Catalogue
                </button>
                <button className="px-10 py-4 border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300 bg-black/40 backdrop-blur-md">
                  System Architecture
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
            <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
          </div>
        </section>

        {/* 🛠️ BLOCK RENDERER ENGINE */}
        <main className="relative z-10">
          <DynamicSection blocks={activeLayout} />
        </main>

        <DiagnosticsPanel />
      </div>
    </BuilderProvider>
  );
}
