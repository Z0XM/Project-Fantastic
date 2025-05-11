import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { buildSystemPrompt } from '@/lib/ai/messageTemplates';
import { pineconeIndex } from '@/lib/pinecone';
import { RecordMetadata } from '@pinecone-database/pinecone';

// Use Node.js runtime instead of Edge
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('Received chat request');
    
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected { messages: Array<{ role: string, content: string }> }',
        receivedBody: body
      }, { status: 400 });
    }

    // Initialize OpenAI client for embeddings
    const openaiEmbeddings = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    // Initialize OpenAI client for chat completions
    const openaiChat = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    // Get the last user message
    const lastUserMessage = body.messages
      .filter((msg: any) => msg.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json({
        success: false,
        error: 'No user message found in the conversation'
      }, { status: 400 });
    }

    console.log('Processing user message:', lastUserMessage.content);

    // Get embeddings for the user's message
    const embeddingResponse = await openaiEmbeddings.embeddings.create({
      model: "text-embedding-3-small",
      input: lastUserMessage.content,
    });

    console.log('Got embeddings for user message');

    const embedding = embeddingResponse.data[0].embedding;

    // Query Pinecone for similar vectors
    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    });

    console.log('Pinecone query response:', queryResponse);

    // Prepare the conversation history
    const conversationHistory = body.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Add relevant context from Pinecone
    const context = queryResponse.matches
      .map(match => match.metadata?.text || '')
      .join('\n');

    // Get AI response using the chat model
    const completion = await openaiChat.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Use this context from previous conversations to inform your response: ${context}`
        },
        ...conversationHistory
      ],
      max_completion_tokens: 10000,
      model: "gpt-35-turbo"
    });

    console.log('Got AI completion');

    const response = completion.choices[0].message.content;

    // Store the conversation in Pinecone
    const responseEmbedding = await openaiEmbeddings.embeddings.create({
      model: "text-embedding-3-small",
      input: response || '',
    });

    console.log('Got embeddings for response');

    const vectorId = `conv-${Date.now()}`;
    await pineconeIndex.upsert([{
      id: vectorId,
      values: responseEmbedding.data[0].embedding,
      metadata: {
        text: response || '',
        query: lastUserMessage.content,
        timestamp: new Date().toISOString(),
        type: 'conversation'
      }
    }]);

    console.log('Stored in Pinecone');

    return NextResponse.json({
      success: true,
      response: {
        role: 'assistant',
        content: response
      },
      context: queryResponse.matches.map(match => ({
        text: match.metadata?.text,
        score: match.score,
        timestamp: match.metadata?.timestamp
      }))
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Unknown error',
        details: error,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
