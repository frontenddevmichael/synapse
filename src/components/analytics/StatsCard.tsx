import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 sm:mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs sm:text-sm font-medium mt-1 sm:mt-2",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
