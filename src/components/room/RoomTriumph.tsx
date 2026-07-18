import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { SynapsePatternBg } from '@/components/illustrations/SynapsePatternBg';

interface RoomTriumphProps {
  roomId: string;
  isOwner: boolean;
}

export function RoomTriumph({ roomId, isOwner }: RoomTriumphProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOwner || dismissed) return;

    const check = async () => {
      const { data } = await supabase.rpc('check_room_triumph', { _room_id: roomId });
      if (data?.triumph) setShow(true);
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [roomId, isOwner, dismissed]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-sm border border-copper/30 bg-card mb-6"
        >
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <SynapsePatternBg className="w-full h-full" />
          </div>
          <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-copper/20 flex items-center justify-center copper-flash">
                <Trophy className="h-5 w-5 text-copper" />
              </div>
              <div>
                <p className="font-bold text-copper">Room Triumph!</p>
                <p className="text-xs text-muted-foreground">Every member scored 70%+ today</p>
              </div>
            </div>
            <button
              onClick={() => { setShow(false); setDismissed(true); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
