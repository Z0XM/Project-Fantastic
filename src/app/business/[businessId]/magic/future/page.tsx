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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pineconeContext, setPineconeContext] = useState<string[]>([]);
  const [isPineconeLoading, setIsPineconeLoading] = useState(true);

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
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          aicontextStrings: pineconeContext,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        // Log the error internally
        console.error('Chat API error:', json.error);
        
        // Check if it's a Pinecone error
        if (json.error?.includes('PineconeConnectionError') || json.error?.includes('ENOTFOUND')) {
          // Continue with the chat without Pinecone context
          console.log('Pinecone connection failed, continuing without context');
          setPineconeContext([]);
          
          // Retry the request without Pinecone context
          const retryRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              aicontextStrings: [],
            }),
          });

          const retryJson = await retryRes.json();
          
          if (!retryJson.success) {
            throw new Error('Failed to generate response. Please try again.');
          }

          if (retryJson.data?.content) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: retryJson.data.content,
              },
            ]);
          }
        } else {
          throw new Error('Failed to generate response. Please try again.');
        }
      } else if (json.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: json.data.content,
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to generate response. Please try again.');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initial API call on page load
  useEffect(() => {
    const fetchInitialResponse = async () => {
      setIsPineconeLoading(true);
      try {
        const response = await fetch(`/api/business/${businessId}/magic/future`);
        const json = await response.json();
        console.log(json.data.content)
        if (!json.success) {
          console.error('Pinecone error:', json.error);
          // Continue with empty context instead of showing error
          setPineconeContext([]);
          
          // If initial load fails, try without Pinecone context
          if (json.error?.includes('PineconeConnectionError') || json.error?.includes('ENOTFOUND')) {
            const retryResponse = await fetch(`/api/business/${businessId}/magic/future`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ skipPinecone: true }),
            });
            const retryJson = await retryResponse.json();
            
            if (retryJson.data?.content) {
              setMessages([
                {
                  role: 'assistant',
                  content: retryJson.data.content,
                },
              ]);
            }
          }
        } else {
          setPineconeContext(json.data?.context || []);
          if (json.data?.content) {
            setMessages([
              {
                role: 'assistant',
                content: json.data.content,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load initial response:', err);
        setPineconeContext([]);
      } finally {
        setIsPineconeLoading(false);
      }
    };

    fetchInitialResponse();
  }, [businessId]);

  return (
    <div className="mx-auto p-4 md:p-6 container">
      <h1 className="mb-6 font-bold text-3xl">AI Future Planning Assistant</h1>

      <div className="flex flex-col bg-white shadow-md border border-pastel-blue/30 rounded-lg h-[70vh]">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {(loading || isPineconeLoading) && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-pastel-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg.content} role={msg.role} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-2 p-4 border-gray-100 border-t bg-white">
          <Input
            className="flex-grow bg-pastel-gray/30 border-pastel-blue/30 focus-visible:ring-pastel-blue"
            placeholder="Ask about future business plans and strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading || isPineconeLoading}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-pastel-blue hover:bg-pastel-blue/80 text-primary-foreground"
            disabled={loading || isPineconeLoading}
          >
            {(loading || isPineconeLoading) ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
