/**
 * AI Service Configuration
 * 
 * Synapse owns its AI layer. This module provides a clean abstraction
 * for quiz generation that can be swapped between providers.
 * 
 * Supported providers:
 * - lovable: Built-in Lovable AI Gateway (default)
 * - openai: OpenAI-compatible APIs (set AI_API_KEY and optionally AI_BASE_URL)
 * - groq: Groq API (set AI_API_KEY)
 */

export interface AIConfig {
  provider: 'lovable' | 'openai' | 'groq';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correct: string;
  explanation?: string;
}

export interface GenerateQuizRequest {
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

export interface GenerateQuizResponse {
  questions: QuizQuestion[];
}

const DEFAULT_MODELS: Record<string, string> = {
  lovable: 'google/gemini-3-flash-preview',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.1-70b-versatile',
};

const BASE_URLS: Record<string, string> = {
  lovable: 'https://ai.gateway.lovable.dev/v1',
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
};

export function getAIConfig(): AIConfig {
  const provider = (Deno.env.get('AI_PROVIDER') || 'lovable') as AIConfig['provider'];
  
  let apiKey: string;
  if (provider === 'lovable') {
    apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
  } else {
    apiKey = Deno.env.get('AI_API_KEY') || '';
  }
  
  const baseUrl = Deno.env.get('AI_BASE_URL') || BASE_URLS[provider];
  const model = Deno.env.get('AI_MODEL') || DEFAULT_MODELS[provider];
  
  return { provider, apiKey, baseUrl, model };
}

export function buildSystemPrompt(difficulty: string, questionCount: number): string {
  const difficultyGuidelines: Record<string, string> = {
    easy: 'Create straightforward questions that test basic recall and understanding. Answers should be clearly indicated in the source material.',
    medium: 'Create questions that require comprehension and connecting ideas. Some inference may be needed.',
    hard: 'Create challenging questions requiring analysis, synthesis, and critical evaluation of the material.',
  };

  return `You are a quiz generator for educational content.

Task: Create exactly ${questionCount} quiz questions from the provided text.

Guidelines:
- Mix question types: primarily multiple choice (4 options), with some true/false
- ${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}
- Questions must be answerable from the provided content
- All options should be plausible; exactly one is correct
- Avoid ambiguous or trick questions
- Write clear, direct questions

Output format: JSON array with this structure for each question:
{
  "question": "Question text",
  "type": "multiple_choice" or "true_false",
  "options": ["A", "B", "C", "D"] or ["True", "False"],
  "correct": "The correct answer exactly as in options"
}`;
}

export async function callAI(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (status === 402) {
      throw new Error('CREDITS_EXHAUSTED');
    }
    const errorText = await response.text();
    console.error(`AI API error (${status}):`, errorText);
    throw new Error('AI_API_ERROR');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export function parseQuizResponse(aiResponse: string): QuizQuestion[] {
  // Extract JSON array from response
  const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('PARSE_ERROR');
  }

  const questions = JSON.parse(jsonMatch[0]);
  
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('EMPTY_RESULT');
  }

  // Validate and normalize
  return questions.map((q, index) => ({
    question: q.question || `Question ${index + 1}`,
    type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
    options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
    correct: q.correct || q.options?.[0] || 'Unknown',
    explanation: q.explanation,
  }));
}
