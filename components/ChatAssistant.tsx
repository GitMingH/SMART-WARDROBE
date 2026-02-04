import React, { useState, useRef, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { chatWithAi } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '你好！我是你的衣橱助手。有什么可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { items } = useWardrobe();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // 构建简单的上下文
    const wardrobeContext = `用户有 ${items.length} 件衣服，包括: ${items.slice(0, 5).map(i => i.category).join(', ')} 等。`;
    
    const replyText = await chatWithAi(userMsg.text, wardrobeContext);
    
    setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 bg-slate-800 text-white p-4 rounded-full shadow-xl transition-transform active:scale-90 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={() => setIsOpen(false)}></div>
            
            {/* Modal */}
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-[600px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto transform transition-transform duration-300">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800">穿搭助手</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="问问我怎么搭配..."
                            className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading}
                            className="bg-blue-600 text-white rounded-xl px-4 py-2 font-bold disabled:opacity-50"
                        >
                            ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;