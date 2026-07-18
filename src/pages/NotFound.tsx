import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LostNeuronIllustration } from "@/components/illustrations/LostNeuronIllustration";
import { fadeUp, stagger } from "@/lib/motion";

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="text-center max-w-sm"
        >
          <motion.div variants={fadeUp}>
            <LostNeuronIllustration className="w-48 h-40 mx-auto mb-6" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Dead end</motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground mb-8">
            This synapse doesn't connect to anything. The page may have moved or never existed.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2 font-bold uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
            <Button onClick={() => navigate(user ? '/dashboard' : '/')} className="gap-2 font-bold uppercase tracking-wider">
              <Home className="h-4 w-4" />
              {user ? 'Dashboard' : 'Home'}
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
