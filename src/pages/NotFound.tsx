import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LostNeuronIllustration } from "@/components/illustrations/LostNeuronIllustration";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <LostNeuronIllustration className="w-48 h-40 mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Dead end</h1>
          <p className="text-muted-foreground mb-8">This synapse doesn't connect to anything.</p>
          <Button onClick={() => navigate('/')} className="gap-2 font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" />
            Back to safety
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
