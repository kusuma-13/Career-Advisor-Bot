
"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && session?.user && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, session]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/chatbot/messages?limit=20", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const history = await response.json();
        // Convert to message format and reverse to show oldest first
        const formattedMessages: Message[] = history.reverse().flatMap((item: any) => [
          { role: "user" as const, content: item.message },
          { role: "assistant" as const, content: item.response },
        ]);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!session?.user) {
      toast.error("Please sign in to use the chatbot");
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Add assistant response
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the user message if failed
      setMessages(messages);
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isPending) return null;

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  // Chat window
  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl border-2 z-50 flex flex-col transition-all duration-300 ${
      isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Career Advisor AI</h3>
            <p className="text-xs text-blue-100">Ask me anything about CareerHub</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && !isLoadingHistory && (
              <div className="text-center text-gray-500 mt-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Welcome to Career Advisor AI!</p>
                <p className="text-xs mt-1">Ask me about jobs, courses, or career guidance</p>
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs"
                    onClick={() => setInput("What features does CareerHub offer?")}
                  >
                    What features does CareerHub offer?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs"
                    onClick={() => setInput("How do I find jobs matching my skills?")}
                  >
                    How do I find jobs matching my skills?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs"
                    onClick={() => setInput("What courses are recommended for BCA students?")}
                  >
                    What courses are recommended for BCA students?
                  </Button>
                </div>
              </div>
            )}

            {isLoadingHistory && (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 mt-2">Loading chat history...</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white dark:bg-gray-950">
            {session?.user ? (
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Please sign in to chat
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  size="sm"
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
