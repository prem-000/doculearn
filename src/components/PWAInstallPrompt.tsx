'use client';

import { useState, useEffect } from 'react';
import { Download, X, Monitor, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { install, canInstall, isInstalled } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (canInstall && !isInstalled) {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
      localStorage.setItem('pwa-prompt-seen', 'true');
    }
  };

  const closePrompt = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-seen', 'true');
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[100]"
        >
          <div className="glass p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50" />
            
            <button 
              onClick={closePrompt}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-full text-muted-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-4 relative z-10">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                <Download className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-lg">Download DocuLearn</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get the full desktop experience with offline access and PDF file handling.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 relative z-10">
              <button 
                onClick={handleInstall}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Download Now
              </button>
              <div className="flex gap-2 items-center px-3 text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
