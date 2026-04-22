'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSparklingLine } from 'react-icons/ri';
import { useNiraChat } from '@/hooks/use-nira-chat';
import { cn } from '@/lib/utils';
import { PromptForm } from './prompt-form';
import { EmptyChat } from './empty-chat';

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1.5 rounded-full bg-text-soft"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

export const MessageWindow = ({
  threadId: _threadId,
  initialQuery,
}: {
  threadId?: string;
  initialQuery?: string;
}) => {
  const { messages, sendMessage, pendingConfirmation, options, isStreaming } = useNiraChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const didSendInitial = useRef(false);

  useEffect(() => {
    if (initialQuery && !didSendInitial.current) {
      didSendInitial.current = true;
      sendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, pendingConfirmation]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <EmptyChat />
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={`msg-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user' ? 'bg-primary-base text-white rounded-tr-sm' : 'bg-bg-weak border border-stroke-soft rounded-tl-sm'
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Thinking state */}
          {isStreaming && (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-bg-weak border border-stroke-soft rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                <StreamingDots />
              </div>
            </motion.div>
          )}

          {/* Dynamic Option Rendering */}
          {pendingConfirmation && options.length > 0 && (
            <motion.div
              key="options"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap gap-2 pl-8 pb-4"
            >
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => sendMessage(`Select ${opt.id}`)}
                  className="px-4 py-2 text-xs font-semibold rounded-full border border-primary-base text-primary-base hover:bg-primary-base hover:text-white transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className='p-2'>
        <PromptForm />
      </div>
    </div>
  );
};