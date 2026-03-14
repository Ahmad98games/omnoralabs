import React from 'react';
import { motion } from 'framer-motion';

export const CinematicLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-neutral-950">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative">
        {/* Outer Glowing Ring */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-20 h-20 rounded-full border-t-2 border-indigo-500/40 border-r-2 border-transparent relative"
        >
          <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)]" />
        </motion.div>

        {/* Inner Core Pulse */}
        <motion.div
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
        </motion.div>
      </div>

      {/* Text Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
          Initializing
        </span>
        <span className="text-sm font-medium text-white/80">
          Omnora OS
        </span>
      </motion.div>
    </div>
  );
};

export default CinematicLoader;
