import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your travel assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Only send the current message
      const response = await axios.post('http://localhost:5000/api/ai/chat', {
        message: input
      });

      // Add bot response
      setMessages(prev => [
        ...prev,
        { text: response.data.response, sender: 'bot' }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-xl shadow-2xl w-96 flex flex-col overflow-hidden" style={{ height: '600px' }}>
          <div className="bg-gradient-to-r from-purple-600 via-orange-500 to-red-500 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="font-semibold text-lg">Travel Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl p-1 -mr-2"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-purple-500 to-red-500 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center bg-white rounded-lg border border-gray-300 overflow-hidden">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 focus:outline-none"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-red-500 text-white p-3 hover:opacity-90 transition-all duration-300"
                aria-label="Send message"
              >
                <FiSend size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300"
        >
          <FiMessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatBot;
