import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { content, difficulty, questionCount = 5 } = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const difficultyPrompts: Record<string, string> = {
      easy: 'Create simple, straightforward questions that test basic understanding. Questions should be clear and answers obvious from the text.',
      medium: 'Create moderately challenging questions that require understanding of concepts. Some questions should require connecting multiple ideas.',
      hard: 'Create challenging questions that require deep understanding, analysis, and synthesis of the material. Include questions that test critical thinking.',
    };

    const systemPrompt = `You are an expert quiz generator for educational content. Your task is to create high-quality quiz questions based on the provided document content.

Guidelines:
- Create exactly ${questionCount} questions
- Mix question types: mostly multiple choice (4 options) with some true/false questions
- ${difficultyPrompts[difficulty] || difficultyPrompts.medium}
- Questions must be directly answerable from the document content
- Ensure all options are plausible but only one is correct
- Avoid trick questions or ambiguous wording
- Make questions educational and test actual understanding`;

    const userPrompt = `Based on the following document content, generate ${questionCount} quiz questions at ${difficulty} difficulty level:

---
${content.substring(0, 8000)}
---

Return the questions as a JSON array with the following structure for each question:
{
  "question": "The question text",
  "type": "multiple_choice" or "true_false",
  "options": ["Option A", "Option B", "Option C", "Option D"] or ["True", "False"],
  "correct": "The correct answer exactly as it appears in options"
}`;

    console.log(`Generating ${questionCount} ${difficulty} questions...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error('Failed to generate quiz questions');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log("AI response received, parsing questions...");

    // Parse the JSON from AI response
    let questions;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw response:", aiResponse);
      throw new Error('Failed to parse quiz questions from AI response');
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }

    // Ensure each question has required fields
    const validatedQuestions = questions.map((q, index) => ({
      question: q.question || `Question ${index + 1}`,
      type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
      options: Array.isArray(q.options) ? JSON.stringify(q.options) : JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
      correct: q.correct || q.options?.[0] || 'Unknown',
    }));

    console.log(`Successfully generated ${validatedQuestions.length} questions`);

    return new Response(
      JSON.stringify({ questions: validatedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-quiz function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate quiz' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
