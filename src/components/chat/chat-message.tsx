import React from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  role: 'user' | 'assistant';
}

const ChatMessage = ({ message, role }: ChatMessageProps) => {
  return (
    <div className={cn('flex w-full mb-4', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 shadow-sm',
          role === 'user'
            ? 'bg-pastel-purple text-gray-800 rounded-br-none'
            : 'bg-pastel-blue text-gray-800 rounded-bl-none'
        )}
      >
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
