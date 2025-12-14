"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  SentIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatResult {
  response: string;
  updatedSections?: Array<{ sectionId: string; updatedContent: unknown }>;
  updatedTheme?: unknown;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string, model: string) => Promise<ChatResult | void>;
  isProcessing: boolean;
}

const models = [
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4o", label: "GPT-4o" },
];

export function ChatSidebar({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gemini");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const result = await onSubmit(userMessage.content, model);

      // Display the AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result?.response || "Changes applied successfully. Let me know if you need anything else!",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full z-40 flex flex-col",
        "bg-background border-l shadow-xl",
        "transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        "w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={SparklesIcon} className="w-5 h-5 text-primary" />
          <h2 className="font-medium">AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">
              Ask me to modify your page. I can help with:
            </p>
            <ul className="text-sm mt-3 space-y-1">
              <li>&bull; Change colors and typography</li>
              <li>&bull; Update text and content</li>
              <li>&bull; Modify section layouts</li>
              <li>&bull; Add or remove elements</li>
            </ul>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to modify your page..."
            className="flex-1 min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isProcessing}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="w-full"
        >
          <HugeiconsIcon icon={SentIcon} className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}
