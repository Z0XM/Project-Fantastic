import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { pineconeIndex } from '@/lib/pinecone';
import { z } from 'zod';
import { capTableInfo } from './info';

// Use Node.js runtime instead of Edge
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reqInput = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  aicontextStrings: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();

    const bodyParse = reqInput.safeParse(reqBody);

    if (!bodyParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: bodyParse.error.message,
          details: bodyParse.error,
        },
        { status: 400 }
      );
    }
    const body = bodyParse.data;

    // Initialize OpenAI client for embeddings
    const openAIEmbeddings = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    // Initialize OpenAI client for chat completions
    const openAIChat = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    // Get the last user message
    const latestUserMessage = body.messages.filter((msg) => msg.role === 'user').pop();

    if (!latestUserMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'No user message found in the conversation',
        },
        { status: 400 }
      );
    }

    // Get embeddings for the user's message
    const embeddingResponse = await openAIEmbeddings.embeddings.create({
      model: 'text-embedding-3-small',
      input: latestUserMessage.content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Query Pinecone for similar vectors
    const pineconeResponse = await pineconeIndex.query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    });

    // Add relevant context from Pinecone
    const context = pineconeResponse.matches.map((match) => match.metadata?.text ?? '').join('\n');

    // Get AI response using the chat model
    const completion = await openAIChat.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `
          You are a helpful and smart assistant for a Cap table management platform.
          The platform allows users to manage their cap tables, including adding and removing shareholders, tracking share ownership, and generating dashboards.
          You have access to the following information on how cap tables work:
          ${capTableInfo}
          The user is on one of the pages of the platform and has asked a question.
          This is some of the infomation that the user is ablle to see on the page:
          ${body.aicontextStrings?.join('\n') ?? ''}
          This is the context which has similarities to the user's question:
          ${context}
          This is the latest question from the user:
          ${latestUserMessage.content}
          Please answer the question in a helpful and informative way and be mathematically accurate.
          If you don't know the answer, say "I don't know" 
          `,
        },
        ...body.messages,
      ],
      max_completion_tokens: 10000,
      model: 'gpt-3.5-turbo',
    });

    const response = completion.choices[0].message.content;
    // Store the conversation in Pinecone
    const responseEmbedding = await openAIEmbeddings.embeddings.create({
      model: 'text-embedding-3-small',
      input: response ?? '',
    });

    console.log('Got embeddings for response');

    const vectorId = `conv-${Date.now()}`;
    await pineconeIndex.upsert([
      {
        id: vectorId,
        values: responseEmbedding.data[0].embedding,
        metadata: {
          text: response ?? '',
          query: latestUserMessage.content,
          timestamp: new Date().toISOString(),
          type: 'conversation',
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: response,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as any).message ?? 'Unknown error',
        details: error,
        stack: (error as any).stack,
      },
      { status: 500 }
    );
  }
}
