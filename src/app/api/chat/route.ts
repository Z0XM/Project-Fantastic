import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { buildSystemPrompt } from '@/lib/ai/messageTemplates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // Always include a system prompt for better consistency
    // const fullMessages = [
    //   { role: 'system', content: 'You are a helpful assistant.' },
    //   ...(messages || [])
    // ];

    // const systemPrompt = buildSystemPrompt(messages || []);
    // const fullMessages = [
    //   { role: 'system', content: systemPrompt },
    //   ...(messages || [])
    // ];

    // const fullMessages = [
    //   { role: 'system', content: "You are a helpful assistant." },
    //   { role: 'user', content: "Today is May 9, 2025. What is today's date?" },
    //   ...(messages || [])
    // ];

    const openai = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "developer", content: "You are a helpful assisstant. Today's date is May 9, 2025."}
      ],
      max_completion_tokens: 100000,
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!
    });

    // Log the full response for debugging
    console.log('Azure OpenAI response:', JSON.stringify(completion, null, 2));

    // Extract the assistant's reply safely
    const content = completion.choices?.[0]?.message?.content ?? null;

    return NextResponse.json({
      content,
      raw: completion, // Optionally include the raw response for debugging
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
