import { NextResponse } from 'next/server';
import { pineconeIndex } from '@/lib/pinecone';
import { AzureOpenAI } from 'openai';
import { NextRequest } from 'next/server';

// Use Node.js runtime instead of Edge
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('Received request');
    
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.testSequence || !Array.isArray(body.testSequence)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected { testSequence: string[] }',
        receivedBody: body
      }, { status: 400 });
    }

    const results = [];

    // Initialize OpenAI client for embeddings
    const openaiEmbeddings = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!, // Use embedding model deployment
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    // Initialize OpenAI client for chat completions
    const openaiChat = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!, // Use chat model deployment
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    });

    console.log('Processing test sequence:', body.testSequence);

    // Process each query in the sequence
    for (const query of body.testSequence) {
      console.log('Processing query:', query);

      // Get embeddings for the query
      const embeddingResponse = await openaiEmbeddings.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });

      console.log('Got embeddings for query');

      const embedding = embeddingResponse.data[0].embedding;

      // Query Pinecone for similar vectors
      const queryResponse = await pineconeIndex.query({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
      });

      console.log('Pinecone query response:', queryResponse);

      // Get AI response using the chat model
      const completion = await openaiChat.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. Use this context from previous conversations to inform your response: ${
              queryResponse.matches
                .map(match => match.metadata?.text || '')
                .join('\n')
            }`
          },
          { role: "user", content: query }
        ],
        max_completion_tokens: 1000,
        model: "o3-mini" // Explicitly specify the chat model
      });

      console.log('Got AI completion');

      const response = completion.choices[0].message.content;

      // Store the conversation in Pinecone using embeddings model
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
          query: query,
          timestamp: new Date().toISOString(),
          type: 'conversation'
        }
      }]);

      console.log('Stored in Pinecone');

      results.push({
        query,
        response,
        context: queryResponse.matches.map(match => ({
          text: match.metadata?.text,
          score: match.score,
          timestamp: match.metadata?.timestamp
        }))
      });
    }

    console.log('Test sequence completed, returning results');

    return NextResponse.json({
      success: true,
      results,
      message: "Test sequence completed successfully"
    });

  } catch (error: any) {
    console.error('Pinecone test error:', error);
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