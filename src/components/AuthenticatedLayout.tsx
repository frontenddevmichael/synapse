import { DesktopNav } from '@/components/DesktopNav';
import { MobileNav } from '@/components/MobileNav';
import { PageHeader } from '@/components/PageHeader';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerActions?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export function AuthenticatedLayout({
  children,
  headerTitle,
  headerActions,
  showBack,
  backTo,
}: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader title={headerTitle} actions={headerActions} backTo={showBack ? backTo : undefined} />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
