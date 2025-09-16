# sfsu-chatbot

A Next.js-powered AI chatbot specifically designed to answer questions about San Francisco State University (SFSU). The chatbot uses OpenAI's API (or Llama) as the main driver and integrates with Perplexity Search API to provide accurate, up-to-date information about SFSU.

## Features

- 🤖 **AI-Powered Responses**: Uses advanced language models to provide helpful answers
- 🔍 **Smart Information Retrieval**: Automatically searches for SFSU-specific information when needed
- 🛡️ **Strong Guardrails**: Only responds to SFSU-related queries with built-in content filtering
- 🎨 **Modern UI**: Clean, responsive chat interface built with Tailwind CSS
- ⚡ **Fast Deployment**: Ready to deploy on Vercel with zero configuration

## Architecture

1. **Main Chatbot Driver**: OpenAI API (configurable for Llama models)
2. **Information Search**: Perplexity Search API for real-time SFSU information
3. **Guardrails**: Content validation ensures only appropriate SFSU-related queries are processed
4. **Frontend**: Next.js with React components and Tailwind CSS
5. **Backend**: Next.js API routes for chat processing

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
LLAMA_API_KEY=your_llama_api_key_here
# Optional: override default Llama base URL
LLAMA_BASE_URL=https://api.llama.com/compat/v1/
PERPLEXITY_API_KEY=your_perplexity_api_key_here
NEXT_TELEMETRY_DISABLED=1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chatbot.

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ka-reem/sfsu-chatbot)

### Manual Deploy

1. Push your code to a GitHub repository
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY` (optional if using OpenAI)
   - `LLAMA_API_KEY` (if using Llama-compatible API)
   - `PERPLEXITY_API_KEY`
4. Deploy!

### Environment Variables in Vercel

1. Go to your project settings in Vercel
3. Navigate to "Environment Variables"
3. Add the required environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `LLAMA_API_KEY`: Your Llama API key (if using Llama-compatible endpoint)
   - `PERPLEXITY_API_KEY`: Your Perplexity API key

## API Keys Setup

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new secret key
5. Copy the key to your environment variables

### Perplexity API Key
1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for API access
3. Get your API key from the dashboard
4. Copy the key to your environment variables

## Customization

### Changing the AI Model

To use Llama instead of GPT models, update the model name in `/src/app/api/chat/route.ts`:

```typescript
const completion = await openaiClient.chat.completions.create({
  model: 'llama-3.1-70b-instruct', // Change this line
  messages: chatMessages,
  temperature: 0.1,
  max_tokens: 1000,
});
```

You may also need to update the `baseURL` in `/src/utils/chatbot.ts` if using a different API endpoint.

### Adding SFSU Keywords

Edit the `SFSU_KEYWORDS` array in `/src/utils/chatbot.ts` to add more terms that should trigger SFSU information searches.

### Customizing Guardrails

Modify the `isValidSFSUQuery` function in `/src/utils/chatbot.ts` to adjust content filtering rules.

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts        # Chat API endpoint
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── components/
│   └── ChatInterface.tsx        # Main chat UI component
├── types/
│   └── chat.ts                  # TypeScript type definitions
└── utils/
    └── chatbot.ts              # Core chatbot logic and API integrations
```

## Key Features Explained

### Guardrails
- Content validation prevents inappropriate queries
- SFSU-specific keyword detection
- Automatic query filtering and redirection

### Information Retrieval
- Automatic detection of SFSU-related queries
- Real-time search via Perplexity API
- Source attribution for search results

### Error Handling
- Graceful API error handling
- User-friendly error messages
- Fallback responses when services are unavailable

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the GitHub Issues page
- Ensure your environment variables are properly set
- Verify API keys are valid and have sufficient credits

---

**Note**: This chatbot is for informational purposes only. For official SFSU information, always refer to [sfsu.edu](https://www.sfsu.edu).
