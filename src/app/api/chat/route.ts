import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient, searchSFSUInfo, isValidSFSUQuery } from '@/utils/chatbot';
import { PerplexitySearchResult } from '@/types/chat';
import { ChatMessage, ChatResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ 
        error: 'No messages provided' 
      }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      return NextResponse.json({ 
        error: 'Last message must be from user' 
      }, { status: 400 });
    }

    // Validate query appropriateness
    const validation = isValidSFSUQuery(lastMessage.content);
    if (!validation.valid) {
      return NextResponse.json({
        message: validation.reason || 'Invalid query',
        usedSearch: false,
      } as ChatResponse);
    }

  let systemMessage = `You are the official San Francisco State University (SFSU) information assistant.
    You MUST ONLY answer questions that are explicitly and directly about SFSU, campus services, admissions, classes, departments, events, student life, facilities, policies, or how to access university resources.

    REQUIRED BEHAVIOR:
    - If the user's question is NOT about SFSU or clearly related to SFSU, REFUSE to answer and reply with a single short sentence asking them to ask a question specifically about SFSU (for example: "I can only answer questions about San Francisco State University (SFSU). Please ask about admissions, classes, campus services, or related topics."). Do NOT attempt to answer non-SFSU questions, including general math, programming, or other domain-specific problems.
    - NEVER hallucinate SFSU facts. If you are not sure, say you don't know and suggest official SFSU resources (admissions.sfsu.edu, sfsu.edu, registrar).
    - Only use information provided in the conversation or the injected search results. If search results are provided, cite them briefly.
    - Keep answers concise and directly actionable for SFSU users.

    Allowed topics examples: "SFSU admission requirements", "how to register for classes at SFSU", "SFSU library hours", "campus parking permits".
    Disallowed topics (must be refused): general math problems, unrelated programming questions, personal medical/legal advice, or queries about other universities.`;

  // We'll ask the model whether a fresh web search is required. If it returns
  // {"search": true} we'll call Perplexity and inject the results into the system message.
  let searchResults: PerplexitySearchResult | null = null;
  let usedSearch = false;

    // Determine whether to perform an external search by asking the model itself.
    let openaiClient;
    try {
      openaiClient = getOpenAIClient();
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Missing API key');
      console.error('API key error:', msg);
      return NextResponse.json({ error: 'Server configuration error', message: msg, usedSearch: false } as ChatResponse, { status: 500 });
    }

    try {
      // Ask the model whether a fresh web search is needed to answer the user's question.
      const decisionMessages = [
        { role: 'system', content: 'You are a strict classifier whose only job is to decide whether the following user question is clearly and specifically about San Francisco State University (SFSU). Return ONLY a JSON object. {"search": true, "explanation": "short reason"} if the question is about SFSU and requires a web search, or {"search": false, "explanation": "short reason"} if it is NOT about SFSU. If the question is ambiguous, return {"search": false, "explanation": "ambiguous - not SFSU-specific"}.' },
        { role: 'user', content: `User question: ${lastMessage.content}` }
      ] as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

      const decisionResp = await openaiClient.chat.completions.create({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: decisionMessages,
        temperature: 0.0,
        max_tokens: 80,
      });

      const decisionText = decisionResp.choices?.[0]?.message?.content || '';
      let decision: { search?: boolean } | null = null;
      try {
        decision = JSON.parse(decisionText.trim());
      } catch {
        // try to extract JSON object from text
        const m = decisionText.match(/\{[\s\S]*\}/);
        if (m) {
          try { decision = JSON.parse(m[0]); } catch { decision = null; }
        }
      }

      if (decision && decision.search) {
        try {
          searchResults = await searchSFSUInfo(lastMessage.content);
          usedSearch = true;
          systemMessage += `\n\nHere is current information about SFSU related to the user's question:\n${searchResults.answer}`;
        } catch (err) {
          console.error('Search error:', err);
          // proceed without search results
        }
      }
    } catch (err) {
      console.error('Search decision error:', err);
      // proceed without search results on error
    }

    // Prepare messages for the final completion (include system message and recent conversation)
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage },
      ...messages.slice(-5).map(msg => ({ role: msg.role as 'user' | 'assistant' | 'system', content: msg.content }))
    ];

    // Get the appropriate model name based on API configuration
    const model = 'Llama-4-Maverick-17B-128E-Instruct-FP8';

    try {
      const completion = await openaiClient.chat.completions.create({
        model,
        messages: chatMessages,
        temperature: 0.1,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0].message.content;

      if (!assistantMessage) {
        throw new Error('No response from AI model');
      }

      const response: ChatResponse = {
        message: assistantMessage,
        usedSearch,
        sources: usedSearch && searchResults ? searchResults.sources : undefined
      };

      return NextResponse.json(response);
    } catch (apiError: unknown) {
      const error = apiError as { message?: string; status?: number; type?: string; code?: string; param?: string };
      console.error('API Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
        param: error.param,
        model: model,
      });
      
      // Try with a different model if this one failed
      if (error.status === 400 && !process.env.OPENAI_API_KEY) {
        console.log('Trying with alternative model name...');
        try {
          const fallbackCompletion = await openaiClient.chat.completions.create({
            model: 'llama-2-7b-chat',
            messages: chatMessages,
            temperature: 0.1,
            max_tokens: 1000,
          });
          
          const fallbackMessage = fallbackCompletion.choices[0].message.content;
          if (fallbackMessage) {
            return NextResponse.json({
              message: fallbackMessage,
              usedSearch,
              sources: usedSearch && searchResults ? searchResults.sources : undefined
            } as ChatResponse);
          }
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError);
        }
      }
      
      throw apiError;
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.',
      usedSearch: false
    } as ChatResponse, { status: 500 });
  }
}