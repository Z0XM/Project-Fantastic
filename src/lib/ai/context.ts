// src/lib/ai/context.ts

export function getToday(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}
  
  // Add more context functions as needed
export function getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US');
}
