"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface ChatInputProps {
  onSend: (content: string, files: File[]) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isSending, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (content.trim() || files.length > 0) && !isSending && !disabled;

  const handleSend = async () => {
    if (!canSend) return;
    const text = content.trim();
    const filesCopy = [...files];
    setContent("");
    setFiles([]);
    await onSend(text, filesCopy);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const valid: File[] = [];
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 20 MB limit`);
        continue;
      }
      valid.push(file);
    }

    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files per message`);
    }
    setFiles(combined);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3 border-t border-border/40 bg-background shrink-0">
      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground max-w-[180px]"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_FILES}
          className={cn(
            "h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={1}
          disabled={isSending || disabled}
          className="min-h-[40px] max-h-32 resize-none rounded-xl border-border/60 bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30 flex-1"
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="h-9 w-9 shrink-0 rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
