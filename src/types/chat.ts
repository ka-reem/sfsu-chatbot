export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface PerplexitySearchResult {
  answer: string;
  sources: string[];
}

export interface ChatResponse {
  message: string;
  usedSearch: boolean;
  sources?: string[];
  error?: string;
}