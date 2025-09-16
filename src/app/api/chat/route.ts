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

  let systemMessage = `You are a helpful chatbot for San Francisco State University (SFSU). 
    You can only answer questions about SFSU and general educational topics. 
    
    IMPORTANT RULES:
    1. Only provide information about SFSU or general educational guidance
    2. If you don't have specific information about SFSU, explicitly say so
    3. Never make up facts about SFSU - always admit if you're unsure
    4. If the user asks about non-SFSU topics, politely redirect them to SFSU-related questions
    5. Be helpful, friendly, and informative
    6. When you receive search results about SFSU, use that information to provide accurate answers`;

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
        { role: 'system', content: 'You are an assistant that decides whether an external web search is required to answer a user question about San Francisco State University (SFSU). Respond with a single JSON object only, for example: {"search": true, "explanation": "short reason"} or {"search": false, "explanation": "reason"}.' },
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

    const completion = await openaiClient.chat.completions.create({
      model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
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

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.',
      usedSearch: false
    } as ChatResponse, { status: 500 });
  }
}