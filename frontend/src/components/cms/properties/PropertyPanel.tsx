import React, { useMemo, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNodeSelector } from '../../../hooks/useNodeSelector';
import { dispatcher } from '../../../platform/core/Dispatcher';
import { PROP_CONFIGS } from './propConfigurations';
import { RefreshCw, Monitor, Smartphone, Upload, Trash2, Loader2 } from 'lucide-react'; // 🛡️ Added Icons
import { supabase } from '../../../lib/supabaseClient'; // 🛡️ For Storage updates
import { useBuilder } from '../../../context/BuilderContext';

interface PropertyPanelProps {
  nodeId: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ nodeId }) => {
  const { merchantId = '' } = useBuilder(); // 🛡️ Retrieve merchant contexts node list Sequential!
  const node = useNodeSelector(nodeId, n => ({
    type: n.type,
    props: n.props || {},
  }));

  const [activeViewport, setActiveViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [uploading, setUploading] = useState(false); // 🛡️ Upload tracking node
  const [uploadProgress, setUploadProgress] = useState(0); // 🛡️ Upload Progress tracking
  const debounceRef = useRef<any>(null);

  const config = useMemo(() => {
    if (!node) return null;
    return PROP_CONFIGS[node.type] || null;
  }, [node]);

  // 🛡️ Upload Local Image Handler
  const uploadImage = async (file: File, property: string, isResponsive: boolean) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and WEBP formats are supported.');
      return;
    }

    setUploading(true);
    setUploadProgress(10); // Start
    
    // Simulate Smooth progress nodes Sequential list!
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 8 : prev));
    }, 200);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `assets/${merchantId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;
      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data: urlData } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        handlePropChange(property, urlData.publicUrl, isResponsive);
      }
    } catch (err) {
      console.error('[PropertyPanel] Upload failed:', err);
      clearInterval(progressInterval);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handlePropChange = useCallback((property: string, value: any, isResponsive = false) => {
    if (!node) return;

    let path = `props.${property}`;
    if (isResponsive) {
      path = `props.${property}.${activeViewport}`;
    }

    dispatcher.dispatch({
      nodeId,
      path,
      value,
      type: 'visual',
      source: 'editor'
    });
  }, [nodeId, node, activeViewport]);

  // 🛡️ Debounced Dispatch (50ms for Sliders/Color Pickers)
  const handlePropChangeDebounced = useCallback((property: string, value: any, isResponsive = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handlePropChange(property, value, isResponsive);
    }, 50); 
  }, [handlePropChange]);

  const handleReset = useCallback(() => {
    if (!node) return;
    
    dispatcher.dispatch({
      nodeId,
      path: 'props',
      value: {},
      type: 'visual',
      source: 'editor'
    });
  }, [nodeId, node]);

  if (!node || !config) {
    return (
      <div className="p-6 text-center text-white/40 text-xs font-mono">
        No advanced properties available for "{node?.type || 'Element'}".
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 font-sans text-white"
    >
      {/* Reset & Viewport Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
          {node.type} Properties
        </span>
        
        <div className="flex items-center gap-4">
          {/* 🛡️ Viewport Switcher */}
          <div className="flex bg-[#18181b] rounded-md p-0.5 border border-white/5">
            <button 
              onClick={() => setActiveViewport('desktop')}
              className={`p-1 rounded ${activeViewport === 'desktop' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
            >
              <Monitor size={12} />
            </button>
            <button 
              onClick={() => setActiveViewport('mobile')}
              className={`p-1 rounded ${activeViewport === 'mobile' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
            >
              <Smartphone size={12} />
            </button>
          </div>

          <button 
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] text-[#D4AF37] opacity-60 hover:opacity-100 transition-opacity"
          >
            <RefreshCw size={10} /> Reset
          </button>
        </div>
      </div>

      {config.sections.map((section, sIdx) => (
        <div 
          key={sIdx}
          className="bg-[#0e0e11] border border-white/5 rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold pb-2 border-bottom border-white/5">
            <section.icon size={14} className="text-[#D4AF37]" />
            {section.title}
          </div>

          <div className="space-y-3">
            {/* 🛡️ AnimatePresence for Conditional Renders Toggle Layouts */}
            <AnimatePresence>
              {section.fields
                .filter(field => !field.visibleIf || field.visibleIf(node.props))
                .map((field, fIdx) => {
                  let currentVal = node.props[field.name];
                  
                  // Extract viewport value if responsive is flagged safe
                  if (field.responsive) {
                    currentVal = currentVal?.[activeViewport] ?? '';
                  }

                  const onChangeHandler = field.type === 'slider' || field.type === 'color' 
                    ? (v: any) => handlePropChangeDebounced(field.name, v, field.responsive)
                    : (v: any) => handlePropChange(field.name, v, field.responsive);

                  return (
                    <motion.div 
                      key={field.name}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-white/40 uppercase tracking-wide">
                          {field.label}
                        </label>
                        {field.responsive && (
                          <span className="text-[9px] text-[#D4AF37]/60 font-mono tracking-wider">
                            {activeViewport.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {field.type === 'text' && (
                        <input 
                          type="text"
                          className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          value={currentVal || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => onChangeHandler(e.target.value)}
                        />
                      )}

                      {field.type === 'number' && (
                        <input 
                          type="number"
                          className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          value={currentVal || ''}
                          min={field.min}
                          max={field.max}
                          onChange={(e) => onChangeHandler(Number(e.target.value))}
                        />
                      )}

                      {field.type === 'slider' && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            className="flex-1 accent-[#D4AF37]"
                            value={currentVal ?? field.min ?? 0}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            onChange={(e) => onChangeHandler(Number(e.target.value))}
                          />
                          <span className="text-[10px] font-mono text-white/80 w-8 text-right">
                            {currentVal ?? field.min ?? 0}
                          </span>
                        </div>
                      )}

                      {field.type === 'select' && (
                        <select 
                          className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                          value={currentVal || ''}
                          onChange={(e) => onChangeHandler(e.target.value)}
                        >
                          {field.options?.map((opt, oIdx) => (
                            <option key={oIdx} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'toggle' && (
                        <div className="flex items-center">
                          <input 
                            type="checkbox"
                            className="accent-[#D4AF37] cursor-pointer"
                            checked={currentVal === true}
                            onChange={(e) => onChangeHandler(e.target.checked)}
                          />
                        </div>
                      )}

                      {field.type === 'color' && (
                        <input 
                          type="color"
                          className="w-full h-8 bg-transparent border-0 rounded cursor-pointer"
                          value={currentVal || '#000000'}
                          onChange={(e) => onChangeHandler(e.target.value)}
                        />
                      )}

                      {(field.type === 'image' || field.type === 'video') && (
                        <div className="flex flex-col gap-2">
                          {currentVal && field.type === 'image' && (
                            <img src={currentVal} alt={field.label} className="w-full h-32 object-cover rounded bg-[#18181b] border border-white/5" />
                          )}
                          <div className="flex items-center gap-2">
                            {field.type === 'image' ? (
                              <>
                                <input 
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  id={`upload-${field.name}`}
                                  disabled={uploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadImage(file, field.name, field.responsive ?? false);
                                  }}
                                />
                                <label 
                                  htmlFor={`upload-${field.name}`}
                                  className="flex-1 flex items-center justify-center gap-2 bg-[#18181b] border border-white/5 hover:border-[#D4AF37]/40 rounded px-3 py-1.5 text-xs text-white/80 cursor-pointer transition-colors"
                                >
                                  {uploading ? <Loader2 size={12} className="animate-spin text-[#D4AF37]" /> : <Upload size={12} />}
                                  {uploading ? 'Uploading...' : 'Local Upload'}
                                </label>
                              </>
                            ) : (
                              <input 
                                type="text"
                                className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                                value={currentVal || ''}
                                placeholder={`Paste ${field.type} URL...`}
                                onChange={(e) => onChangeHandler(e.target.value)}
                              />
                            )}
                            {currentVal && (
                              <button 
                                onClick={() => handlePropChange(field.name, '', field.responsive ?? false)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          {uploading && field.type === 'image' && (
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                              <div className="bg-[#D4AF37] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </motion.div>
  );
};
