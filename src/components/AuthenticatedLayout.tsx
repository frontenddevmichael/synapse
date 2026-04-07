import { DesktopNav } from '@/components/DesktopNav';
import { MobileNav } from '@/components/MobileNav';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
