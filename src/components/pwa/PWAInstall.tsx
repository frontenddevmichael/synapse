import { useState, useEffect } from 'react';
import { Download, Smartphone, Share, Check, Monitor, Zap, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { fadeUp, stagger, viewport } from '@/lib/motion';

interface PWAInstallProps {
  /** 'section' for landing page, 'banner' for sticky bottom, 'inline' for in-page */
  variant: 'section' | 'banner' | 'inline';
  onClose?: () => void;
}

export function PWAInstall({ variant, onClose }: PWAInstallProps) {
  const {
    isInstalled,
    platform,
    isIOSSafari,
    canInstallNatively,
    needsManualInstall,
    promptInstall,
    dismissInstall,
    shouldShowPrompt,
  } = usePWAInstall();
  const prefersReducedMotion = useReducedMotion();

  const isIOS = platform === 'ios';

  // For banner/inline: respect shouldShowPrompt
  if (variant !== 'section' && !shouldShowPrompt) return null;
  // For section: hide if already installed
  if (variant === 'section' && isInstalled) return null;

  const handleInstall = async () => {
    if (canInstallNatively) {
      const installed = await promptInstall();
      if (installed) onClose?.();
    }
  };

  const handleDismiss = () => {
    dismissInstall();
    onClose?.();
  };

  // ─── Banner variant ───
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-xl border-t border-border/30 shadow-2xl z-50"
      >
        <div className="container max-w-4xl mx-auto flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Install Synapse</p>
            <p className="text-xs text-muted-foreground truncate">
              {isIOS ? 'Tap Share → Add to Home Screen' : 'Offline access & faster loading'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canInstallNatively && (
              <Button size="sm" onClick={handleInstall} className="font-semibold">
                Install
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Inline variant ───
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="p-2 rounded-xl bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install Synapse</p>
          <p className="text-xs text-muted-foreground">
            {isIOS ? 'Tap Share, then "Add to Home Screen"' : 'Access your rooms offline, faster loading'}
          </p>
        </div>
        {canInstallNatively && (
          <Button size="sm" onClick={handleInstall} className="font-semibold">Install</Button>
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

  // ─── Section variant (landing page) ───
  const benefits = [
    { icon: WifiOff, text: 'Works offline' },
    { icon: Zap, text: 'Faster loading' },
    { icon: Smartphone, text: 'Home screen access' },
  ];

  const animationProps = prefersReducedMotion
    ? {}
    : { variants: stagger, initial: 'hidden', whileInView: 'visible', viewport };

  return (
    <motion.section
      {...animationProps}
      className="py-16 sm:py-24 border-t border-border/30 bg-gradient-to-b from-primary/5 to-transparent"
    >
      <div className="container max-w-5xl px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Download className="h-3.5 w-3.5" />
              Install App
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4">
              Get Synapse on your device
            </h2>

            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Install Synapse for a faster, native app experience. Access your study rooms anytime, even offline.
            </p>

            <ul className="space-y-3 mb-6">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {canInstallNatively && (
              <Button size="lg" onClick={handleInstall} className="gap-2 w-full sm:w-auto font-semibold">
                <Download className="h-4 w-4" />
                Install Synapse
              </Button>
            )}

            {needsManualInstall && (
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <p className="font-bold text-sm mb-3">To install on {isIOSSafari ? 'Safari' : 'iOS'}:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Tap the <Share className="inline h-4 w-4 mx-0.5" /> Share button in Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    <span>Tap "Add" to confirm</span>
                  </li>
                </ol>
              </div>
            )}

            {!canInstallNatively && !needsManualInstall && platform !== 'unknown' && (
              <p className="text-sm text-muted-foreground">
                <Monitor className="inline h-4 w-4 mr-1" />
                Use Chrome or Edge to install this app on {platform === 'desktop' ? 'your computer' : 'your device'}.
              </p>
            )}
          </motion.div>

          {/* Device Mockup */}
          <motion.div variants={fadeUp} className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-56 h-[420px] bg-gradient-to-b from-foreground/10 to-foreground/5 rounded-[2.5rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[2rem] overflow-hidden border border-border">
                  <div className="h-7 bg-card flex items-center justify-center">
                    <div className="w-16 h-1 bg-foreground/20 rounded-full" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Synapse</div>
                        <div className="text-[10px] text-muted-foreground">Study smarter</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border mb-3">
                      <div className="h-2 w-20 bg-muted rounded mb-2" />
                      <div className="h-2 w-full bg-muted rounded mb-2" />
                      <div className="grid grid-cols-2 gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-6 rounded text-[8px] flex items-center justify-center ${
                            i === 2 ? 'bg-success/20 text-success' : 'bg-muted'
                          }`}>
                            {i === 2 && <Check className="h-3 w-3" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded-lg bg-primary/10 text-center">
                        <div className="text-xs font-black text-primary">12</div>
                        <div className="text-[8px] text-muted-foreground">Quizzes</div>
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-success/10 text-center">
                        <div className="text-xs font-black text-success">85%</div>
                        <div className="text-[8px] text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 h-20 w-20 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 bg-accent/10 rounded-full blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
