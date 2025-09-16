import OpenAI from 'openai';
import { PerplexitySearchResult } from '@/types/chat';

// Initialize OpenAI client for Llama API (lazy initialization)
function getOpenAIClient() {
  // Prefer LLAMA_API_KEY for Llama-compatible endpoints, fall back to OPENAI_API_KEY
  const apiKey = process.env.LLAMA_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.LLAMA_BASE_URL || 'https://api.llama.com/compat/v1/';

  if (!apiKey) {
    throw new Error('No API key found. Set LLAMA_API_KEY or OPENAI_API_KEY in your environment.');
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export { getOpenAIClient };

// SFSU-related keywords that trigger search
const SFSU_KEYWORDS = [
  'sfsu', 'san francisco state university', 'san francisco state',
  'gators', 'admission', 'enrollment', 'tuition', 'fees', 'campus',
  'classes', 'courses', 'departments', 'faculty', 'professors',
  'library', 'housing', 'dormitory', 'dining', 'events', 'clubs',
  'sports', 'athletics', 'parking', 'transportation', 'muni',
  'registration', 'schedule', 'grades', 'transcript', 'graduation',
  'degree', 'major', 'minor', 'academic calendar', 'semester',
  'financial aid', 'scholarships', 'student services', 'health center',
  'counseling', 'career center', 'bookstore'
];

// Check if query is related to SFSU
export function requiresSFSUInfo(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return SFSU_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

// Search for SFSU information using Perplexity API
export async function searchSFSUInfo(query: string): Promise<PerplexitySearchResult> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that searches for accurate, up-to-date information about San Francisco State University (SFSU). Provide a concise answer and include sources in the response metadata.' },
          { role: 'user', content: `Find current information about SFSU related to: ${query}` }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Perplexity non-OK response', res.status, body);
      throw new Error(`Perplexity API error: ${res.status}`);
    }

    const data = await res.json();
    // Perplexity returns the assistant text at choices[0].message.content and
    // includes citations and search_results arrays in top-level keys.
    const answer = data?.choices?.[0]?.message?.content || '';
    const extractUrl = (item: unknown): string | null => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      if (typeof obj.url === 'string') return obj.url;
      return null;
    };

    const citations = data?.citations || (Array.isArray(data?.search_results) ? data.search_results.map(extractUrl).filter(Boolean) as string[] : []) || [];

    return {
      answer,
      sources: citations,
    } as PerplexitySearchResult;
  } catch (error) {
    console.error('Error searching SFSU info:', error);
    throw new Error('Failed to search for SFSU information');
  }
}

// Validate that query is appropriate for SFSU chatbot
export function isValidSFSUQuery(query: string): { valid: boolean; reason?: string } {
  const lowerQuery = query.toLowerCase().trim();
  
  // Block inappropriate content
  const inappropriate = [
    'porn', 'sex', 'drugs', 'violence', 'hate', 'racism',
    'how to cheat', 'homework answers', 'exam answers',
    'illegal', 'hack', 'break into', 'password'
  ];
  
  if (inappropriate.some(word => lowerQuery.includes(word))) {
    return { 
      valid: false, 
      reason: 'I can only help with general questions about SFSU. Please ask something related to the university.' 
    };
  }
  
  // Ensure query is somewhat related to education or SFSU
  if (lowerQuery.length < 3) {
    return { 
      valid: false, 
      reason: 'Please provide a more specific question about SFSU.' 
    };
  }
  
  return { valid: true };
}