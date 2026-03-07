import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { 
  getAIConfig, 
  buildSystemPrompt, 
  callAI, 
  parseQuizResponse 
} from "../_shared/ai-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = getAIConfig();
    
    if (!config.apiKey) {
      throw new Error('AI API key not configured');
    }

    const { content, difficulty, questionCount = 10 } = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const count = Math.min(Math.max(questionCount, 5), 25);
    
    console.log(`Generating ${count} ${difficulty} questions via ${config.provider}...`);

    const systemPrompt = buildSystemPrompt(difficulty, count);
    const userPrompt = `Generate quiz questions from this content:\n\n${content.substring(0, 10000)}`;

    const aiResponse = await callAI(config, systemPrompt, userPrompt);
    const questions = parseQuizResponse(aiResponse);

    console.log(`Generated ${questions.length} questions`);

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
