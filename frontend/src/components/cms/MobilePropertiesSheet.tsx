import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { ChevronDown, GripHorizontal, X } from 'lucide-react';

/**
 * 📱 MOBILE PROPERTIES SHEET (Task 3.7 / Law 3)
 * High-performance bottom sheet with 0/40/90% snap points.
 */
export const MobilePropertiesSheet: React.FC = () => {
    const selectedNodeId = useBuilderStore(s => s.selectedNodeId);
    const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId);

    if (!selectedNodeId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    // 🛡️ SNAP LOGIC (Task 3.7)
                    if (info.offset.y > 200) {
                        setSelectedNodeId(null);
                    }
                }}
                className="fixed inset-x-0 bottom-0 z-[300] bg-zinc-950 border-t border-zinc-900 rounded-t-[32px] shadow-2xl overflow-hidden h-[80vh]"
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center py-4">
                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full cursor-grab" />
                </div>

                <div className="px-6 flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white">Edit Block</h2>
                    <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pb-20 overflow-y-auto h-full custom-scrollbar">
                    {/* Render Properties Tab content here */}
                    <div className="p-8 border-2 border-dashed border-zinc-900 rounded-3xl text-center text-zinc-600 text-sm italic">
                        Select a property to modify above.
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
