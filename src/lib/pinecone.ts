import { Pinecone } from '@pinecone-database/pinecone';

// Validate environment variables
const requiredEnvVars = {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log Pinecone configuration (without sensitive data)
console.log('Initializing Pinecone with index:', process.env.PINECONE_INDEX_NAME);

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize index
export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// Verify connection by attempting a simple query
const verifyConnection = async () => {
  try {
    // Try to fetch index stats
    await pineconeIndex.fetch([{ id: 'test-connection' }]);
    console.log('Successfully connected to Pinecone index:', process.env.PINECONE_INDEX_NAME);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('Successfully connected to Pinecone, but index is empty (which is expected)');
    } else {
      console.error('Failed to connect to Pinecone:', error);
      throw new Error('Failed to connect to Pinecone. Please check your configuration and network connection.');
    }
  }
};

// Run verification
verifyConnection().catch(console.error); 