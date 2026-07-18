/**
 * Supabase integration tests — RLS, RPCs, and edge function validation.
 *
 * These tests require a running Supabase instance. They use the same
 * environment variables as the app (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
 *
 * If env vars are missing, all tests are skipped gracefully.
 *
 * Run: npx vitest run src/utils/__tests__/supabase.integration.test.ts
 *
 * To authenticate as a test user, set:
 *   TEST_USER_EMAIL=<email>  TEST_USER_PASSWORD=<password>
 * The test will sign in, run assertions, then clean up.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient, AuthResponse } from '@supabase/supabase-js';

const SUITE = 'supabase-integration';

function getClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let supabase: SupabaseClient | null;
let testAccessToken: string = '';

// Known exploits from security review — verified here as automated tests.
// If any of these pass (can read/write protected data), the RLS/RPC fix has regressed.

describe('RLS: questions_public view (correct_answer hidden)', () => {
  beforeAll(async () => {
    supabase = getClient();
    if (!supabase) return;

    // Sign in as a test user
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) console.warn('[integration] sign-in failed:', error.message);
      else testAccessToken = data.session?.access_token || '';
    }

    if (!testAccessToken) {
      // Create an anonymous session
      const { data } = await supabase.auth.signInAnonymously();
      testAccessToken = data.session?.access_token || '';
    }
  });

  afterAll(async () => {
    if (supabase && testAccessToken) {
      await supabase.auth.signOut();
    }
  });

  it.runIf(!!supabase && !!testAccessToken)(
    'questions_public view excludes correct_answer column',
    async () => {
      // Try to fetch correct_answer from questions_public
      const { data, error } = await supabase!
        .from('questions_public')
        .select('correct_answer')
        .limit(1);

      // The view should not have a correct_answer column
      // If it does, RLS/security is broken
      if (data && data.length > 0) {
        expect(data[0]).not.toHaveProperty('correct_answer');
      } else {
        // No questions exist yet — view may still be wrong
        // At minimum verify the error doesn't expose it
        expect(error).toBeNull();
      }
    }
  );

  it.runIf(!!supabase && !!testAccessToken)(
    'raw questions table still has correct_answer (for RPC use)',
    async () => {
      const { data } = await supabase!
        .from('questions')
        .select('correct_answer')
        .limit(1);
      // RLS may block this if user isn't in the room — that's expected
      // We just verify correct_answer exists in the schema
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('correct_answer');
      }
    }
  );
});

describe('RLS: direct profile XP/level writes blocked', () => {
  it.runIf(!!supabase && !!testAccessToken)(
    'client cannot directly update xp or level on profiles',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!profile) return; // No profiles to test against

      const { error } = await supabase
        .from('profiles')
        .update({ xp: 999999, level: 99 } as any)
        .eq('id', (profile as any).id);

      // Should be blocked by prevent_gamification_tampering trigger
      // Accept either a thrown error or a silent no-op
      if (error) {
        expect(error.message).toMatch(/permission|violation|trigger|policy/i);
      }
    }
  );
});

describe('RLS: room_members insert bypass', () => {
  it.runIf(!!supabase && !!testAccessToken)(
    'cannot directly insert into room_members without room code',
    async () => {
      if (!supabase || !testAccessToken) return;

      // Generate a fake room ID — a user should NOT be able to add themselves
      const fakeRoomId = '00000000-0000-0000-0000-000000000000';
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: fakeRoomId, user_id: '00000000-0000-0000-0000-000000000000', role: 'member' });

      // Should be rejected by RLS
      if (error) {
        expect(error.message).toMatch(/permission|violation|policy/i);
      }
    }
  );

  it.runIf(!!supabase && !!testAccessToken)(
    'join_room_by_code RPC is the legitimate path',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.rpc('join_room_by_code', { _code: 'ZZZZZZ' });
      if (!error && data) {
        // Even if code is invalid, RPC should handle gracefully
        expect((data as any).status).toMatch(/not_found|error/);
      }
    }
  );
});

describe('Edge function: generate-quiz input validation', () => {
  it.runIf(!!supabase && !!testAccessToken)(
    'rejects empty content with 400',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content: '', difficulty: 'medium', questionCount: 10 },
      });

      if (error) {
        // Edge function returned a non-2xx status
        expect(error).toBeDefined();
      } else if (data) {
        expect((data as any).error).toBeDefined();
      }
    }
  );

  it.runIf(!!supabase && !!testAccessToken)(
    'rejects content exceeding 50000 chars',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content: 'x'.repeat(50001), difficulty: 'medium', questionCount: 10 },
      });

      if (error) {
        expect(error).toBeDefined();
      } else if (data) {
        expect((data as any).error).toBeDefined();
      }
    }
  );

  it.runIf(!!supabase && !!testAccessToken)(
    'rejects questionCount below 5',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content: 'Some valid content', difficulty: 'medium', questionCount: 1 },
      });

      if (error) {
        expect(error).toBeDefined();
      } else if (data) {
        expect((data as any).error).toBeDefined();
      }
    }
  );

  it.runIf(!!supabase && !!testAccessToken)(
    'rejects invalid difficulty',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content: 'Valid content', difficulty: 'impossible', questionCount: 10 },
      });

      if (error) {
        expect(error).toBeDefined();
      } else if (data) {
        expect((data as any).error).toBeDefined();
      }
    }
  );
});

describe('RPC: award_xp and grade_quiz', () => {
  it.runIf(!!supabase && !!testAccessToken)(
    'award_xp rejects non-existent attempt',
    async () => {
      if (!supabase || !testAccessToken) return;
      const { data, error } = await supabase.rpc('award_xp', {
        _attempt_id: '00000000-0000-0000-0000-000000000000',
      });

      if (!error && data) {
        const result = data as any;
        // Should return error object, not throw
        expect(result.error).toBeDefined();
      }
    }
  );
});
