import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const pageView = {
      user_id: user?.id ?? null,
      path: location.pathname + location.search,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    };

    supabase.from("page_views").insert(pageView).then(({ error }) => {
      if (error) console.warn("Failed to log page view:", error.message);
    });
  }, [location.pathname, location.search, user?.id]);
}
