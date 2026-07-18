import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator)) return;
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setSubscribed(!!data));
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) return;
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('VAPID key not configured. Set VITE_VAPID_PUBLIC_KEY in env.');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      const { error } = await supabase.from('push_subscriptions').upsert(
        { user_id: user.id, subscription: subscription.toJSON() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      setSubscribed(true);
    } catch (err: any) {
      console.warn('[push] subscribe failed:', err.message);
      setSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      setSubscribed(false);
    } catch (err: any) {
      console.warn('[push] unsubscribe failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { permission, subscribed, isLoading, subscribe, unsubscribe };
}
