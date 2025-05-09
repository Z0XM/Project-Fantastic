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

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setResponse(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();

      // Handle error from backend
      if (data.error) {
        setResponse(`Error: ${data.error}`);
      } else if (data.content && data.content.trim()) {
        setResponse(data.content);
      } else {
        setResponse('No response from AI. (It may have been filtered or empty.)');
      }
    } catch {
      setResponse('Error fetching response');
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
        {response && (
          <div className="p-4 text-sm text-primary">
            <strong>AI:</strong> {response}
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
