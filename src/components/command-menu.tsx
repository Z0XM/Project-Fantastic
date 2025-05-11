'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useEffect, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Submit on Enter
  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && prompt.trim()) {
      await handleSubmit();
    }
  };

  // Call the backend API
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    // Add user message to the conversation
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });
      
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response from AI');
      }

      // Add assistant's response to the conversation
      if (data.response?.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response.content
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Clear the input
      setPrompt('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a prompt for AI..."
        value={prompt}
        onValueChange={setPrompt}
        onKeyDown={handleInputKeyDown}
        disabled={loading}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
        {loading && <div className="p-4 text-sm text-muted-foreground">Loading...</div>}
        {error && (
          <div className="p-4 text-sm text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className="p-4 text-sm">
            <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong>{' '}
            {message.content}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
