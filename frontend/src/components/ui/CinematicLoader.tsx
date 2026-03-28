import React from 'react';
import { motion } from 'framer-motion';

export const CinematicLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#000000]">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-16 h-16 rounded-full border-t border-white/10 border-r border-transparent"
        />

        {/* Inner Core Pulse */}
        <motion.div
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
        </motion.div>
      </div>

      {/* Text Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
          Kernel Initializing
        </span>
        <div className="w-32 h-[1px] bg-white/5 overflow-hidden">
          <motion.div 
            animate={{ x: [-128, 128] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1/2 h-full bg-white/20"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CinematicLoader;
