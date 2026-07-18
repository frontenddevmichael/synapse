export interface AIConfig {
  provider: 'openai' | 'groq' | 'gemini';
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
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.0-flash',
};

const BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

export function getAIConfig(): AIConfig {
  const provider = (Deno.env.get('AI_PROVIDER') || 'openai') as AIConfig['provider'];
  const apiKey = Deno.env.get('AI_API_KEY') || '';
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
  if (config.provider === 'gemini') {
    return callGemini(config, systemPrompt, userPrompt);
  }
  return callOpenAICompatible(config, systemPrompt, userPrompt);
}

async function callGemini(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const status = response.status;
    if (status === 429 && attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Gemini rate limited, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    if (status === 429) throw new Error('RATE_LIMIT');
    if (status === 402) throw new Error('CREDITS_EXHAUSTED');
    const errorText = await response.text();
    console.error(`Gemini API error (${status}):`, errorText);
    throw new Error('AI_API_ERROR');
  }

  throw new Error('RATE_LIMIT');
}

async function callOpenAICompatible(
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
    if (status === 429) throw new Error('RATE_LIMIT');
    if (status === 402) throw new Error('CREDITS_EXHAUSTED');
    const errorText = await response.text();
    console.error(`AI API error (${status}):`, errorText);
    throw new Error('AI_API_ERROR');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export function parseQuizResponse(aiResponse: string): QuizQuestion[] {
  const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('PARSE_ERROR');
  }

  const questions = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('EMPTY_RESULT');
  }

  return questions.map((q, index) => ({
    question: q.question || `Question ${index + 1}`,
    type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
    options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
    correct: q.correct || q.options?.[0] || 'Unknown',
    explanation: q.explanation,
  }));
}
