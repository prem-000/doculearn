'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // 1. Check if browser supports PWA installation
    const supportsInstall = typeof window !== 'undefined' && 
      ('beforeinstallprompt' in window || (window.navigator as any).standalone !== undefined);
    setIsSupported(supportsInstall);

    // 2. Check if already installed
    const checkIsInstalled = () => {
      if (typeof window === 'undefined') return false;
      
      // For iOS
      if ((window.navigator as any).standalone) return true;
      
      // For others
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      
      return false;
    };

    setIsInstalled(checkIsInstalled());

    // 3. Check if prompt was already captured by the global script
    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
      setCanInstall(true);
    }

    // 4. Listen for the install prompt
    const handler = (e: BeforeInstallPromptEvent) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 5. Listen for appinstalled event
    const installedHandler = () => {
      console.log('App was installed');
      setIsInstalled(true);
      setCanInstall(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }
    
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setCanInstall(false);
        return true;
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
    return false;
  };

  return { install, canInstall, isInstalled, isSupported };
}
