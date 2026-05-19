import { memo } from 'react';
import { Award, Crown, Medal, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  quizzes_taken: number;
}

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

function LeaderboardPanelImpl({ leaderboard, currentUserId }: LeaderboardPanelProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="bento-card py-16 flex flex-col items-center text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-bold text-lg mb-1">No scores yet</h3>
        <p className="text-muted-foreground">Complete quizzes to appear on the leaderboard</p>
      </div>
    );
  }

  return (
    <>
      {/* Top 3 Podium */}
      <div className="hidden sm:grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
        {/* 2nd */}
        <div className="flex flex-col items-center justify-end">
          {leaderboard[1] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
              <div className="h-14 w-14 mx-auto rounded-xl bg-muted flex items-center justify-center mb-2">
                <span className="font-bold text-lg">{leaderboard[1].username.charAt(0).toUpperCase()}</span>
              </div>
              <p className="font-bold text-sm truncate max-w-[100px]">{leaderboard[1].username}</p>
              <p className="text-2xl font-black text-muted-foreground">{leaderboard[1].total_score}</p>
              <div className="h-20 w-full rounded-t-xl bg-muted/50 border border-border/30 mt-2 flex items-center justify-center">
                <Medal className="h-6 w-6 text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </div>
        {/* 1st */}
        <div className="flex flex-col items-center justify-end">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }} className="text-center">
            <div className="h-16 w-16 mx-auto rounded-xl bg-gold/15 border-2 border-gold/30 flex items-center justify-center mb-2 legendary-glow">
              <span className="font-black text-xl text-gold">{leaderboard[0].username.charAt(0).toUpperCase()}</span>
            </div>
            <p className="font-bold truncate max-w-[120px]">{leaderboard[0].username}</p>
            <p className="text-3xl font-black text-gold">{leaderboard[0].total_score}</p>
            <div className="h-28 w-full rounded-t-xl bg-gold/10 border border-gold/20 mt-2 flex items-center justify-center">
              <Crown className="h-8 w-8 text-gold" />
            </div>
          </motion.div>
        </div>
        {/* 3rd */}
        <div className="flex flex-col items-center justify-end">
          {leaderboard[2] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
              <div className="h-14 w-14 mx-auto rounded-xl bg-muted flex items-center justify-center mb-2">
                <span className="font-bold text-lg">{leaderboard[2].username.charAt(0).toUpperCase()}</span>
              </div>
              <p className="font-bold text-sm truncate max-w-[100px]">{leaderboard[2].username}</p>
              <p className="text-2xl font-black text-muted-foreground">{leaderboard[2].total_score}</p>
              <div className="h-14 w-full rounded-t-xl bg-muted/50 border border-border/30 mt-2 flex items-center justify-center">
                <Award className="h-5 w-5 text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Full rankings */}
      <div className="bento-card p-0 overflow-hidden">
        <div className="divide-y divide-border/30">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                entry.user_id === currentUserId ? 'bg-primary/5' : 'hover:bg-muted/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-gold/15 text-gold' :
                index <= 2 ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">
                  {entry.username}
                  {entry.user_id === currentUserId && <span className="text-xs text-primary ml-2">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.quizzes_taken} quiz{entry.quizzes_taken !== 1 ? 'zes' : ''} completed
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl">{entry.total_score}</p>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">weighted pts</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export const LeaderboardPanel = memo(LeaderboardPanelImpl);
