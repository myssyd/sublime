"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Placeholder for Sprint 2 - will be replaced with actual AI chat
export default function NewPagePage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hi! I'm Sublime, your AI landing page assistant. Tell me about your business and I'll help you create the perfect landing page. What does your business do?",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    // Simulate AI response (will be replaced with actual agent in Sprint 2)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thanks for sharing! This feature will be fully functional in Sprint 2 when we integrate the AI agent. For now, this is a preview of the conversational interface.",
        },
      ]);
    }, 1000);

    setMessage("");
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Landing Page</h1>
        <p className="text-muted-foreground">
          Chat with AI to generate your perfect landing page
        </p>
      </div>

      {/* Chat messages */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
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
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="flex gap-2 border-t pt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your business..."
              className="min-h-[44px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!message.trim()}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
