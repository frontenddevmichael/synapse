import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  getAIConfig,
  buildSystemPrompt,
  callAI,
  parseQuizResponse,
} from "../_shared/ai-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RequestSchema = z.object({
  content: z.string().min(1, "Document content is required").max(50000, "Content too long"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  questionCount: z.number().int().min(5).max(25).optional().default(10),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT verified by gateway (verify_jwt = true in config.toml)
    const userId = req.headers.get('x-supabase-auth-uid');
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, difficulty, questionCount } = parsed.data;

    // Rate limiting
    const { data: rateLimit, error: rateError } = await supabase.rpc('check_rate_limit', {
      _user_id: userId,
      _function_name: 'generate-quiz',
      _max_requests: 10,
      _window_seconds: 60,
    });

    if (rateError) {
      console.error('Rate limit check failed:', rateError);
    } else if (!rateLimit?.allowed) {
      const retryAfter = rateLimit?.retry_after ?? 60;
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } }
      );
    }

    const config = getAIConfig();
    if (!config.apiKey) {
      throw new Error('AI_API_KEY_MISSING');
    }

    console.log(`Generating ${questionCount} ${difficulty} questions via ${config.provider}...`);

    const systemPrompt = buildSystemPrompt(difficulty, questionCount);
    const userPrompt = `Generate quiz questions from this content:\n\n${content.substring(0, 10000)}`;

    const aiResponse = await callAI(config, systemPrompt, userPrompt);
    const questions = parseQuizResponse(aiResponse);

    const formattedQuestions = questions.map(q => ({
      question: q.question,
      type: q.type,
      options: JSON.stringify(q.options),
      correct: q.correct,
    }));

    return new Response(
      JSON.stringify({ questions: formattedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Quiz generation error:", error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorMap: Record<string, { status: number; message: string }> = {
      'RATE_LIMIT': { status: 429, message: 'Too many requests. Please wait a moment.' },
      'CREDITS_EXHAUSTED': { status: 402, message: 'AI credits exhausted.' },
      'AI_API_KEY_MISSING': { status: 500, message: 'AI service not configured.' },
      'PARSE_ERROR': { status: 500, message: 'Failed to parse AI response. Please try again.' },
      'EMPTY_RESULT': { status: 500, message: 'No questions generated. Try different content.' },
      'AI_API_ERROR': { status: 500, message: 'AI service error. Please try again.' },
    };

    const mapped = errorMap[message] || { status: 500, message };

    return new Response(
      JSON.stringify({ error: mapped.message }),
      { status: mapped.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
