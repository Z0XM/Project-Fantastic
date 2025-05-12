'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAppSelector } from '@/hooks/store';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Clock, Trash } from '@phosphor-icons/react';
import { Badge } from './ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function CommandMenu() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const storedMessages = typeof window !== 'undefined' ? localStorage.getItem('messages') : null;
    return storedMessages ? JSON.parse(storedMessages) : [];
  });

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
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

  const aiContext = useAppSelector((state) => state.aiContext.value);

  const aicontextStrings = Object.values(aiContext).map((context) => context.contextString);

  // Call the backend API
  const handleSubmit = async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: prompt }],
          aicontextStrings,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? 'Failed to generate response.');
      }

      // Add assistant's response to the conversation
      if (json.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: json.response.content,
          },
        ]);
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
        placeholder="Ask something for a fantastic answer..."
        value={prompt}
        onValueChange={setPrompt}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && prompt.trim()) {
            e.preventDefault();
            setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
            handleSubmit(prompt);
          }
        }}
        disabled={loading}
      />
      <CommandList className="px-4">
        {messages.length ? (
          <div className="flex justify-end items-center gap-4 mt-1">
            <Button size={'sm'} variant={'destructive'} onClick={() => setMessages([])}>
              <Trash size={12} />
            </Button>
          </div>
        ) : null}
        {messages.length === 0 ? <CommandEmpty>Tip: Communication is the key.</CommandEmpty> : null}
        {/* <CommandGroup heading="Recent Chats">
          {messages.slice(0, 3).map((message, index) => (
        <CommandItem
          onClick={(e) => {
            e.preventDefault();
            setPrompt(message.content);
          }}
          className="flex justify-start items-center text-xs cursor-pointer"
          key={index}
        >
          <Clock size={12} /> {message.content}
        </CommandItem>
          ))}
        </CommandGroup> */}

        {loading && <div className="p-4 text-muted-foreground text-sm">Loading...</div>}
        {error && (
          <div className="p-4 text-red-500 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="flex flex-col gap-2 py-2">
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div key={index} className="flex items-center gap-2 bg-accent py-1 text-xs">
                <Badge variant={'outline'} className="bg-pastel-green">
                  You
                </Badge>
                {message.content}
              </div>
            ) : (
              <div key={index} className="flex items-center gap-2 bg-accent py-1 text-xs">
                <Badge variant={'outline'} className="bg-pastel-lavender">
                  AI
                </Badge>
                {message.content}
              </div>
            )
          )}
        </div>
      </CommandList>
    </CommandDialog>
  );
}
