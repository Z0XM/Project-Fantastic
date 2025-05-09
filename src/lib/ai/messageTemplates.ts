import { getToday, getCurrentTime } from './context';

export function buildSystemPrompt(messages: { role: string; content: string }[]): string {
  const userPrompt = messages?.find(msg => msg.role === 'user')?.content?.toLowerCase() || '';
  let context = "You are a helpful assistant. Today is May 9th, 2025.";

  if (userPrompt.includes('date')) {
    context += ` Today's date is ${getToday()}.`;
  }
  if (userPrompt.includes('time')) {
    context += ` The current time is ${getCurrentTime()}.`;
  }
  // Add more context rules as needed

  return context;
}
