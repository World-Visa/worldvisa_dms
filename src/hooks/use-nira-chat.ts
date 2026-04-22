import { useState, useMemo, useId } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_ENDPOINTS } from '@/lib/config/api';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Option {
  id: string;
  label: string;
}

export const useNiraChat = () => {
  const { userId, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(false);
  const [options, setOptions] = useState<Option[]>([]);
  
  // Use useMemo to ensure threadId does not change on every render
  const instanceId = useId().replace(/:/g, '');
  const threadId = useMemo(() => `${userId ?? 'anon'}-${instanceId}`, [userId, instanceId]);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    const token = await getToken();

    const response = await fetch(API_ENDPOINTS.NIRA.CHAT, {
      method: 'POST',
      body: JSON.stringify({ message, threadId }),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.body) {
      setIsStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log("Frontend received:", data); // DEBUG LOG

          if (data.type === 'text') {
            setMessages((prev) => {
              const newMessages = [...prev];
              const last = newMessages[newMessages.length - 1];
              if (last?.role === 'assistant') {
                return [...newMessages.slice(0, -1), { ...last, content: last.content + data.content }];
              } else {
                return [...newMessages, { role: 'assistant', content: data.content }];
              }
            });
          } else if (data.type === 'meta') {
            console.log("Meta data detected:", data);
            if (data.needsConfirmation) {
              setPendingConfirmation(true);
              setOptions(data.options || []);
            }
          }
        } catch (e) {
          console.error("Error parsing JSON line", e);
        }
      }
    }
    setIsStreaming(false);
  };

  const reset = () => {
    setMessages([]);
    setPendingConfirmation(false);
    setOptions([]);
    setIsStreaming(false);
  };

  return { messages, sendMessage, pendingConfirmation, options, isStreaming, threadId, reset };
};