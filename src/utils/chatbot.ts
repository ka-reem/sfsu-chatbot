import OpenAI from 'openai';
import { PerplexitySearchResult } from '@/types/chat';

// Initialize OpenAI client for Llama API (lazy initialization)
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1', // Can be changed to Llama API endpoint
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that searches for accurate, up-to-date information about San Francisco State University (SFSU). Only provide factual information from reliable sources.'
          },
          {
            role: 'user',
            content: `Find current information about SFSU related to: ${query}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.choices[0].message.content,
      sources: data.citations || []
    };
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