import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { pineconeIndex } from '@/lib/pinecone';
import { z } from 'zod';
import { capTableInfo } from '@/app/api/chat/info';
import { prisma } from '@/lib/prisma';

// Use Node.js runtime instead of Edge
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params;

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

    const businessEvents = await prisma.businessEvents.findMany({ where: { businessId: businessId } });
    const investments = await prisma.investments.findMany({ where: { round: { businessId } } });
    const transactions = await prisma.stakeholderEvents.findMany({ where: { round: { businessId } } });
    const stakeholders = await prisma.stakeholders.findMany({
      where: { businessId },
      include: { user: { select: { name: true } } },
    });

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
          Here is the list of business events as json: ${JSON.stringify(businessEvents)} 
          Here is the list of the investments as json: ${JSON.stringify(investments)} 
          Here is the list of the transactions of shares that have happened as json: ${JSON.stringify(transactions)} 
          Here is the list of the stakeholders as json: ${JSON.stringify(stakeholders)}
          Generate a future plan for the business based on the information provided.
          The plan should include the following:
          1. A summary of the current state of the business.
          2. A list of potential future events that could impact the business.
          3. A list of recommendations for the business based on the current state and potential future events.
          4. A list of potential risks and challenges that the business may face in the future.
          5. A list of potential opportunities for the business in the future.
          6. A list of potential strategies for the business to pursue in the future.
          `,
        },
      ],
      max_completion_tokens: 10000,
      model: 'gpt-3.5-turbo',
    });

    const response = completion.choices[0].message.content;
    ``;
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
          query: 'generate a future plan for the business',
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
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message ?? 'Unknown error',
        details: error,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
