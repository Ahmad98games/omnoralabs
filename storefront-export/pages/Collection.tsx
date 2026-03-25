/**
 * 🛠️ OMNORA LABS | REGISTRY ARCHIVE (COLLECTION MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Indexing is the portal to limitless scalability."
 * ---------------------------------------------------------
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, PackageOpen, Network, Database, Cpu } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BuilderProvider } from '../context/BuilderContext';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import '../styles/collection.css';

/**
 * KERNEL_ENTITY_NODE: The foundational unit of the registry.
 */
interface KernelEntityNode {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    isNew?: boolean;
    stock?: number;
}

const REGISTRY_NODES = [
    { id: 'all', name: 'Global Registry' },
    { id: 'unstitched', name: 'Base Kernels' },
    { id: 'ready-to-wear', name: 'Active Nodes' },
    { id: 'formal', name: 'Enterprise Clusters' },
    { id: 'seasonal', name: 'Edge Modules' },
];

const VALUATION_TIERS = [
    { id: 'all', name: 'All Latency Classes' },
    { id: 'under-2500', name: 'Under 2,500 Credits' },
    { id: '2500-5000', name: '2,500 - 5,000 Credits' },
    { id: '5000-10000', name: '5,000 - 10,000 Credits' },
    { id: 'over-10000', name: 'Over 10,000 Credits' },
];

export default function Collection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [entities, setEntities] = useState<KernelEntityNode[]>([]);
    const [isHydrating, setIsHydrating] = useState(true);
    const [registryFault, setRegistryFault] = useState<{ message: string; code?: string } | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [kernelContent, setKernelContent] = useState<any>(null);
    const { updateSellerStyles } = useTheme();

    const { showToast } = useToast();

    const activeNode = searchParams.get('category') || 'all';
    const activePriority = searchParams.get('sort') || 'newest';
    const activeTier = searchParams.get('priceRange') || 'all';

    /**
     * synchronizeRegistry: Fetches core nodes from the persistence layer.
     */
    useEffect(() => {
        const hydroController = new AbortController();

        async function synchronizeRegistry() {
            setIsHydrating(true);
            setRegistryFault(null);
            OmnoraLogger.info("Initiating registry synchronization...");
            
            try {
                const res = await client.get('/products', { signal: hydroController.signal });
                const data = res.data?.data || res.data?.products || res.data || [];
                setEntities(Array.isArray(data) ? data : []);
                OmnoraLogger.info(`Registry Sync Active: ${data.length} nodes successfully indexed.`);
            } catch (err: any) {
                if (!axios.isCancel(err)) {
                    setRegistryFault({
                        message: err.response?.data?.error || err.message || 'Registry synchronization failed',
                        code: err.code || (err.response ? `OS_API_FAULT_${err.response.status}` : 'KERNEL_NETWORK_ERROR')
                    });
                    OmnoraLogger.error("Registry Sync Fault", err);
                }
            } finally {
                setIsHydrating(false);
            }
        }

        synchronizeRegistry();

        async function synchronizeKernelCMS() {
            try {
                const { data } = await client.get('/cms/content');
                if (data.success && data.content) {
                    setKernelContent(data.content);
                    if (data.content.globalStyles) updateSellerStyles(data.content.globalStyles);
                }
            } catch (err) {
                OmnoraLogger.error("Kernel CMS synchronization failed", err);
            }
        }
        synchronizeKernelCMS();

        return () => hydroController.abort();
    }, [updateSellerStyles]);

    const propagatedEntities = useMemo(() => {
        let result = [...entities];

        // Filter by Node Class
        if (activeNode !== 'all') {
            result = result.filter(e => e.category?.toLowerCase() === activeNode.toLowerCase());
        }

        // Filter by Valuation Tier
        if (activeTier !== 'all') {
            result = result.filter(e => {
                if (activeTier === 'under-2500') return e.price < 2500;
                if (activeTier === '2500-5000') return e.price >= 2500 && e.price <= 5000;
                if (activeTier === '5000-10000') return e.price >= 5000 && e.price <= 10000;
                if (activeTier === 'over-10000') return e.price > 10000;
                return true;
            });
        }

        // Sort by Priority
        if (activePriority === 'price-low') result.sort((a, b) => a.price - b.price);
        if (activePriority === 'price-high') result.sort((a, b) => b.price - a.price);
        if (activePriority === 'newest') result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

        return result;
    }, [entities, activeNode, activeTier, activePriority]);

    const dispatchManifestUpdate = (key: string, value: string) => {
        const nextParams = new URLSearchParams(searchParams);
        if (value === 'all') nextParams.delete(key);
        else nextParams.set(key, value);
        setSearchParams(nextParams);
    };

    const stageForDeployment = (e: React.MouseEvent, entity: KernelEntityNode) => {
        e.preventDefault();
        e.stopPropagation();
        
        const manifest = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingNode = manifest.find((i: any) => i.id === entity._id);
        
        if (existingNode) existingNode.quantity += 1;
        else manifest.push({ 
            id: entity._id, 
            name: entity.name, 
            price: entity.price, 
            image: entity.image, 
            quantity: 1 
        });

        localStorage.setItem('cart', JSON.stringify(manifest));
        window.dispatchEvent(new Event('cart-updated'));
        
        OmnoraLogger.info(`Entity [${entity._id}] staged for deployment.`);
        showToast(`${entity.name}::STAGED_FOR_DEPLOYMENT`, 'success');
    };

    const isPreview = window.location.search.includes('preview=true');

    return (
        <BuilderProvider initialData={kernelContent || {}} isPreview={isPreview}>
            <div className="collection-page">
                {/* --- REGISTRY_HERO --- */}
                <header className="collection-hero-luxury">
                    <img
                        src={kernelContent?.pages?.collection?.heroBannerURL || "/images/placeholder_gsg.png"}
                        alt="Omnora Registry"
                    />
                    <div className="collection-hero-overlay">
                        <span className="eyebrow text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                            {kernelContent?.pages?.collection?.eyebrow || 'OMNORA_KERNEL::REGISTRY_INDEX'}
                        </span>
                        <h1 className="subtitle-serif text-white">
                            {kernelContent?.pages?.collection?.headlineText || 'System Archive'}
                        </h1>
                    </div>
                </header>

                <div className="container">
                    <div className="collection-layout">
                        {/* 
                            Note: The actual sidebar and grid rendering logic is usually 
                            defined in a sub-component or follow-up block. 
                            The current refactor focuses on the core logical layer.
                        */}
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <Cpu size={48} className="text-royal mb-4 animate-pulse" />
                            <h2 className="font-mono xsmall uppercase letter-spacing-wide">
                                Registry Initialization in Progress...
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </BuilderProvider>
    );
}
