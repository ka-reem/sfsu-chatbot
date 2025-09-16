import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            SFSU Chatbot
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Your AI assistant for San Francisco State University
          </p>
          <div className="bg-white rounded-lg p-4 shadow-md max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              What can I help you with?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• Admissions & enrollment</div>
              <div>• Tuition & financial aid</div>
              <div>• Campus facilities</div>
              <div>• Academic programs</div>
              <div>• Student services</div>
              <div>• Events & activities</div>
            </div>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="h-[600px]">
          <ChatInterface />
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            This is an AI chatbot for informational purposes. 
            For official information, please visit{' '}
            <a 
              href="https://www.sfsu.edu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              sfsu.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
