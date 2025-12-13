"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NewPagePage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startThread = useAction(api.agents.actions.startGenerationThread);
  const sendMessageAction = useAction(api.agents.actions.sendMessage);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize thread on mount
  useEffect(() => {
    const initThread = async () => {
      try {
        const result = await startThread();
        setThreadId(result.threadId);
        setMessages([
          {
            role: "assistant",
            content: result.welcomeMessage,
          },
        ]);
      } catch (error) {
        console.error("Failed to start thread:", error);
        setMessages([
          {
            role: "assistant",
            content:
              "Sorry, I had trouble starting our conversation. Please refresh the page to try again.",
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    initThread();
  }, [startThread]);

  const handleSend = async () => {
    if (!message.trim() || !threadId || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const result = await sendMessageAction({
        threadId,
        message: userMessage,
      });

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);

      // If a page was generated, redirect to editor
      if (result.pageId) {
        setTimeout(() => {
          router.push(`/editor/${result.pageId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Landing Page</h1>
        <p className="text-muted-foreground">
          Chat with AI to generate your perfect landing page
        </p>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col p-4">
          {/* Chat messages */}
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {isInitializing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-muted-foreground">
                    Starting conversation...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <HugeiconsIcon
                        icon={Loading01Icon}
                        className="w-5 h-5 animate-spin text-muted-foreground"
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2 border-t pt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your business..."
              className="min-h-[44px] resize-none"
              disabled={isLoading || isInitializing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading || isInitializing}
            >
              {isLoading ? (
                <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
