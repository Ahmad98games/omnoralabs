import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNodeSelector } from '../../../hooks/useNodeSelector';
import { dispatcher } from '../../../platform/core/Dispatcher';
import { PROP_CONFIGS } from './propConfigurations';
import { RefreshCw } from 'lucide-react';

interface PropertyPanelProps {
  nodeId: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ nodeId }) => {
  const node = useNodeSelector(nodeId, n => ({
    type: n.type,
    props: n.props || {},
  }));

  const config = useMemo(() => {
    if (!node) return null;
    return PROP_CONFIGS[node.type] || null;
  }, [node]);

  const handlePropChange = useCallback((property: string, value: any) => {
    if (!node) return;

    dispatcher.dispatch({
      nodeId,
      path: `props.${property}`,
      value,
      type: 'visual',
      source: 'editor'
    });
  }, [nodeId, node]);

  const handleReset = useCallback(() => {
    if (!node) return;
    
    // Dispatch reset by fully clearing props (or fallback defaults)
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
      {/* Reset Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
          {node.type} Properties
        </span>
        <button 
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-[#D4AF37] opacity-60 hover:opacity-100 transition-opacity"
        >
          <RefreshCw size={10} /> Reset
        </button>
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
            {section.fields.map((field, fIdx) => {
              const currentVal = node.props[field.name];

              return (
                <div key={fIdx} className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase tracking-wide">
                    {field.label}
                  </label>

                  {field.type === 'text' && (
                    <input 
                      type="text"
                      className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                      value={currentVal || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handlePropChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === 'number' && (
                    <input 
                      type="number"
                      className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                      value={currentVal || ''}
                      min={field.min}
                      max={field.max}
                      onChange={(e) => handlePropChange(field.name, Number(e.target.value))}
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
                        onChange={(e) => handlePropChange(field.name, Number(e.target.value))}
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
                      onChange={(e) => handlePropChange(field.name, e.target.value)}
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
                        onChange={(e) => handlePropChange(field.name, e.target.checked)}
                      />
                    </div>
                  )}

                  {field.type === 'color' && (
                    <input 
                      type="color"
                      className="w-full h-8 bg-transparent border-0 rounded cursor-pointer"
                      value={currentVal || '#000000'}
                      onChange={(e) => handlePropChange(field.name, e.target.value)}
                    />
                  )}

                  {(field.type === 'image' || field.type === 'video') && (
                    <input 
                      type="text"
                      className="w-full bg-[#18181b] border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                      value={currentVal || ''}
                      placeholder={`Paste ${field.type} URL...`}
                      onChange={(e) => handlePropChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
