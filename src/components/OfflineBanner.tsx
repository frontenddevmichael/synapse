import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning/90 backdrop-blur-sm text-warning-foreground px-4 py-2 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      You're offline — showing cached data
      <Wifi className="h-3.5 w-3.5 shrink-0 ml-1" />
    </div>
  );
}
