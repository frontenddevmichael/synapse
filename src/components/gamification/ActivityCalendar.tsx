import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityDay {
  date: Date;
  quizzes: number;
  xp: number;
  accuracy: number;
}

interface ActivityCalendarProps {
  activities: ActivityDay[];
  weeks?: number;
}

export function ActivityCalendar({ activities, weeks = 12 }: ActivityCalendarProps) {
  const today = new Date();
  const startDate = startOfWeek(subDays(today, (weeks - 1) * 7));
  const endDate = today;
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group by week
  const weekGroups: Date[][] = [];
  let currentWeek: Date[] = [];
  
  allDays.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0 || index === allDays.length - 1) {
      weekGroups.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getActivityForDay = (date: Date): ActivityDay | undefined => {
    return activities.find(a => isSameDay(new Date(a.date), date));
  };

  const getIntensity = (quizzes: number): 0 | 1 | 2 | 3 | 4 => {
    if (quizzes === 0) return 0;
    if (quizzes === 1) return 1;
    if (quizzes <= 3) return 2;
    if (quizzes <= 5) return 3;
    return 4;
  };

  const intensityClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-muted hover:bg-muted/80',
    1: 'bg-success/20 hover:bg-success/30',
    2: 'bg-success/40 hover:bg-success/50',
    3: 'bg-success/60 hover:bg-success/70',
    4: 'bg-success hover:bg-success/90'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Activity</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((intensity) => (
            <div
              key={intensity}
              className={cn('w-3 h-3 rounded-sm', intensityClasses[intensity])}
            />
          ))}
          <span>More</span>
        </div>
      </div>
      
      <div className="flex gap-1 overflow-x-auto pb-2">
        <TooltipProvider delayDuration={0}>
          {weekGroups.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const activity = getActivityForDay(day);
                const intensity = getIntensity(activity?.quizzes || 0);
                const isCurrentDay = isToday(day);
                
                return (
                  <Tooltip key={day.toISOString()}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm transition-colors cursor-pointer',
                          intensityClasses[intensity],
                          isCurrentDay && 'ring-1 ring-foreground ring-offset-1 ring-offset-background'
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                        {activity ? (
                          <>
                            <p>{activity.quizzes} quiz{activity.quizzes !== 1 ? 'zes' : ''}</p>
                            <p>{activity.xp} XP earned</p>
                            {activity.accuracy > 0 && (
                              <p>{Math.round(activity.accuracy)}% accuracy</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No activity</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>
      
      {/* Month labels */}
      <div className="flex text-xs text-muted-foreground">
        {weekGroups
          .filter((week, index) => {
            const firstOfMonth = week.find(d => d.getDate() <= 7);
            return firstOfMonth && index > 0;
          })
          .map((week, index) => {
            const firstDayOfMonth = week.find(d => d.getDate() <= 7) || week[0];
            return (
              <span key={index} className="flex-1">
                {format(firstDayOfMonth, 'MMM')}
              </span>
            );
          })}
      </div>
    </div>
  );
}
