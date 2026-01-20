import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /android/.test(userAgent);
  
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  if (/windows|macintosh|linux/.test(userAgent) && !/mobile/.test(userAgent)) return 'desktop';
  return 'unknown';
}

function isIOSSafari(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios|mercury/.test(userAgent);
  return isIOS && isSafari;
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isIOSSafariBrowser, setIsIOSSafariBrowser] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect platform
    setPlatform(detectPlatform());
    setIsIOSSafariBrowser(isIOSSafari());

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);

    // Handle the beforeinstallprompt event
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
      localStorage.setItem('synapse-pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPromptRef.current) return false;

    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      deferredPromptRef.current = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, []);

  const dismissInstall = useCallback(() => {
    localStorage.setItem('synapse-pwa-dismissed', Date.now().toString());
  }, []);

  const shouldShowPrompt = useCallback(() => {
    if (isInstalled) return false;
    
    const dismissed = localStorage.getItem('synapse-pwa-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        return false;
      }
    }
    
    return isInstallable || platform === 'ios';
  }, [isInstalled, isInstallable, platform]);

  // Can show native install prompt (Chrome, Edge, etc.)
  const canInstallNatively = isInstallable && deferredPromptRef.current !== null;
  
  // iOS requires manual instructions
  const needsManualInstall = platform === 'ios' && !isInstalled;

  return {
    isInstallable: isInstallable || platform === 'ios',
    isInstalled,
    platform,
    isIOSSafari: isIOSSafariBrowser,
    canInstallNatively,
    needsManualInstall,
    promptInstall,
    dismissInstall,
    shouldShowPrompt: shouldShowPrompt()
  };
}
