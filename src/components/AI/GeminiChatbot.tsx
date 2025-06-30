import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Brain, TrendingUp, X, MessageCircle } from 'lucide-react';
import { getCurrentUser, getUserQuizResults, getUserStudyPlans } from '../../utils/storage';
import { generateChatResponse } from '../../services/geminiService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = getCurrentUser();
  const quizResults = user ? getUserQuizResults(user.id) : [];
  const studyPlans = user ? getUserStudyPlans(user.id) : [];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hello ${user?.name}! 👋 I'm your AI learning assistant powered by Google Gemini. I can help you analyze your quiz performance, suggest study improvements, and answer questions about your learning journey. What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user?.name, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare user context for Gemini
      const userContext = {
        recentQuizzes: quizResults.slice(-5).map(result => ({
          subject: result.subject,
          score: result.score,
          date: result.completedAt
        })),
        studyPlans: studyPlans.map(plan => ({
          subject: plan.subject,
          score: plan.score,
          createdAt: plan.createdAt
        })),
        performance: quizResults.length > 0 ? {
          average: Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length),
          total: quizResults.length,
          bestScore: Math.max(...quizResults.map(r => r.score))
        } : null
      };

      const aiResponseText = await generateChatResponse(userMessage.content, userContext);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble processing your request right now. Please try again later! 🤖",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-morphism rounded-3xl w-full max-w-2xl h-[600px] border border-white/20 shadow-glass flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-glow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">Gemini AI Assistant</h3>
              <p className="text-white/60 text-sm">Powered by Google Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-300" />
                    <span className="text-xs text-white/70 font-medium">Gemini AI</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs text-white/50 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-300" />
                  <span className="text-xs text-white/70 font-medium">Gemini AI is thinking...</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/20">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your performance, study tips, or learning strategies..."
              rows={2}
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                inputMessage.trim() && !isTyping
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-glow hover:scale-105'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatbot;