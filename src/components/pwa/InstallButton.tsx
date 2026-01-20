import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallButtonProps {
  className?: string;
}

export function InstallButton({ className }: InstallButtonProps) {
  const { canInstallNatively, isInstalled, promptInstall } = usePWAInstall();

  // Only show if native install prompt is available
  if (!canInstallNatively || isInstalled) return null;

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleInstall}
      className={className}
    >
      <Download className="h-4 w-4 mr-1.5" />
      Install
    </Button>
  );
}