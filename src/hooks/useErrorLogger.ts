import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useErrorLogger() {
  const { user } = useAuth();

  const logError = useCallback(
    async (error: Error, componentStack?: string) => {
      try {
        await supabase.from('error_logs').insert({
          user_id: user?.id ?? null,
          error_message: error.message,
          error_stack: error.stack,
          component_stack: componentStack,
          url: window.location.href,
          user_agent: navigator.userAgent,
        });
      } catch {
        // Silently fail — logging should never break the app
      }
    },
    [user]
  );

  return { logError };
}
