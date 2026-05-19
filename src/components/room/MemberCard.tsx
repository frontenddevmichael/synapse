import { memo } from 'react';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface MemberCardProps {
  username: string;
  displayName: string | null;
  role: string;
  delay?: number;
}

function MemberCardImpl({ username, displayName, role, delay = 0 }: MemberCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="bento-card">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-lg">{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{displayName || username}</p>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>
          <Badge variant="outline" className={role === 'owner' ? 'border-gold/30 text-gold bg-gold/10' : ''}>
            {role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
            {role}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

export const MemberCard = memo(MemberCardImpl);
