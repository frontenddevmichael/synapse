import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

// Lightweight offline cache for Supabase queries
const CACHE_PREFIX = 'synapse_cache_';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>): { data: T | null; loading: boolean; stale: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setData(parsed.value);
          setLoading(false);
          if (!online) return; // Skip fetch if offline and cache is fresh
        } else {
          setStale(true); // Cache expired, but still show it
        }
      } catch { /* ignore corrupt cache */ }
    }

    if (!online) {
      // Offline and no fresh cache — show whatever we have
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed.value);
        } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    fetcher().then((result) => {
      setData(result);
      setLoading(false);
      setStale(false);
      localStorage.setItem(cacheKey, JSON.stringify({ value: result, timestamp: Date.now() }));
    }).catch(() => {
      setLoading(false);
    });
  }, [key, online]);

  return { data, loading, stale };
}
