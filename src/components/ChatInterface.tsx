"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ChatMessage, ChatResponse } from "@/types/chat";

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "**Hello!** I'm the SFSU Chatbot. I can help answer questions about San Francisco State University. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageSources, setMessageSources] = useState<{[key: number]: string[]}>({});
  const [expandedSources, setExpandedSources] = useState<{[key: number]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.sources && data.sources.length > 0) {
        const messageIndex = messages.length + 1; // +1 because we just added the assistant message
        setMessageSources(prev => ({...prev, [messageIndex]: data.sources!}));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Simple header with SFSU colors */}
      <header className="bg-gradient-to-r from-purple-700 to-purple-800 text-white px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <Bot size={24} />
          <h1 className="text-xl font-semibold">SFSU Chatbot</h1>
        </div>
      </header>

      {/* Chat messages - takes up most of the screen */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-yellow-600 text-white' : 'bg-purple-700 text-white'}`}>
                    {message.role === 'user' ? <User size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </div>
                  <div className={`${message.role === 'user' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-800 border border-gray-200'} rounded-lg p-3 sm:p-4 shadow-sm`}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]} className="prose prose-sm sm:prose prose-slate max-w-none prose-headings:text-purple-800 prose-strong:text-purple-700">
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                    )}
                    {message.timestamp && (
                      <p className="text-xs mt-2 opacity-60 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sources dropdown for this message */}
              {messageSources[index] && messageSources[index].length > 0 && (
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'mr-11 sm:mr-13' : 'ml-11 sm:ml-13'}`}>
                    <button
                      onClick={() => setExpandedSources(prev => ({...prev, [index]: !prev[index]}))}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-1"
                    >
                      {expandedSources[index] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Sources ({messageSources[index].length})
                    </button>
                    {expandedSources[index] && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 space-y-1">
                        {messageSources[index].map((source: string, sourceIndex: number) => (
                          <a key={sourceIndex} href={source} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-yellow-700 hover:underline">
                            <ExternalLink size={12} />
                            <span className="truncate">{source}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-700 text-white flex items-center justify-center">
                <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="bg-white text-gray-700 border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about SFSU..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-purple-700 text-white p-2 sm:p-3 rounded-lg hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            This chatbot is not affiliated with SFSU and may contain inaccuracies. Please refer to the official SFSU website for accurate, up-to-date information.
          </div>
        </div>
      </div>
    </div>
  );
}