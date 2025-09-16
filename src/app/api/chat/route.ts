import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient, requiresSFSUInfo, searchSFSUInfo, isValidSFSUQuery } from '@/utils/chatbot';
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

    let searchResults = null;
    let usedSearch = false;

    // Check if query requires SFSU-specific information
    if (requiresSFSUInfo(lastMessage.content)) {
      try {
        searchResults = await searchSFSUInfo(lastMessage.content);
        usedSearch = true;
        systemMessage += `\n\nHere is current information about SFSU related to the user's question:\n${searchResults.answer}`;
      } catch (error) {
        console.error('Search error:', error);
        // Continue without search results
      }
    }

    // Prepare messages for OpenAI/Llama
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage },
      ...messages.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
    ];

    // Get response from Llama via OpenAI client
    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo', // Change to 'llama-3.1-70b-instruct' or appropriate Llama model
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