import { DesktopNav } from '@/components/DesktopNav';
import { MobileNav } from '@/components/MobileNav';
import { PageHeader } from '@/components/PageHeader';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  /** Set to false to hide the default PageHeader (e.g. for pages with a custom header) */
  showHeader?: boolean;
  /** Override the default header */
  header?: React.ReactNode;
}

export function AuthenticatedLayout({ children, showHeader = true, header }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0">
        {header ?? (showHeader && <PageHeader />)}
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
