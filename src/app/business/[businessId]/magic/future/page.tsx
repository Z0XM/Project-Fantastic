'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/chat/chat-message';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FuturePlans() {
  const { businessId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);

  useQuery({
    queryKey: ['future', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/magic/future`);
      const json = await response.json();

      if (!json.success) {
        toast.error(json.error ?? 'Failed to generate response.');
      }
      if (json.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: json.data.content,
          },
        ]);

        return json.data.content;
      }
      return '';
    },
  });

  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: input,
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);

    // Call the backend API to generate AI response

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="mx-auto p-4 md:p-6 container">
      <h1 className="mb-6 font-bold text-3xl">AI Future Planning Assistant</h1>

      <div className="flex flex-col bg-white shadow-md border border-pastel-blue/30 rounded-lg h-[70vh]">
        <ScrollArea className="flex-grow px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg.content} role={msg.role} />
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-gray-100 border-t">
          <Input
            className="flex-grow bg-pastel-gray/30 border-pastel-blue/30 focus-visible:ring-pastel-blue"
            placeholder="Ask about future business plans and strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-pastel-blue hover:bg-pastel-blue/80 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
