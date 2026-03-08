import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background noise-bg mesh-gradient">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-8xl font-black tracking-tighter text-primary mb-4">404</p>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} className="gap-2 font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
