import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallPromptProps {
  variant?: 'banner' | 'card' | 'inline';
  onClose?: () => void;
}

export function InstallPrompt({ variant = 'banner', onClose }: InstallPromptProps) {
  const { isInstallable, isIOS, promptInstall, dismissInstall, shouldShowPrompt } = usePWAInstall();

  if (!shouldShowPrompt) return null;

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, just show instructions
      return;
    }
    const installed = await promptInstall();
    if (installed) {
      onClose?.();
    }
  };

  const handleDismiss = () => {
    dismissInstall();
    onClose?.();
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="p-2 rounded-full bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install Synapse</p>
          <p className="text-xs text-muted-foreground">
            {isIOS 
              ? 'Tap Share, then "Add to Home Screen"' 
              : 'Access your rooms offline, faster loading'}
          </p>
        </div>
        {!isIOS && (
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
        )}
        {isIOS && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Share className="h-4 w-4" />
            <span>→ Add</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Get the Synapse app</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isIOS 
                ? 'Add Synapse to your home screen for the best experience. Tap the share button, then "Add to Home Screen".' 
                : 'Install Synapse for offline access, faster loading, and a native app experience.'}
            </p>
            {!isIOS && (
              <Button onClick={handleInstall} className="gap-2">
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
            {isIOS && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share className="h-4 w-4" />
                <span>Tap Share → "Add to Home Screen"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg z-50 animate-slide-up">
      <div className="container max-w-4xl mx-auto flex items-center gap-4">
        <div className="p-2 rounded-full bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Install Synapse</p>
          <p className="text-xs text-muted-foreground truncate">
            {isIOS 
              ? 'Tap Share → Add to Home Screen' 
              : 'Offline access & faster loading'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isIOS && (
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
