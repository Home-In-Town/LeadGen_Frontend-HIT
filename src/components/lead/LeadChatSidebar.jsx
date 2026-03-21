import React, { useState, useEffect, useRef } from 'react';
import { getChatMessages, sendChatMessage } from '../../api';
import { useNotifications } from '../../context/NotificationContext';

const LeadChatSidebar = ({ isOpen, onClose, leadId, leadName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { socketRef } = useNotifications();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchMessages();
    }
  }, [isOpen, leadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !leadId) return;

    socket.emit('join_lead', leadId); // joins lead_${leadId} room on server

    const handleNewMessage = (payload) => {
        if (payload.leadId === leadId || payload._id) {
            setMessages(prev => [...prev, payload]);
        }
    };

    socket.on('new_chat_message', handleNewMessage);
    return () => {
        socket.off('new_chat_message', handleNewMessage);
    };
  }, [leadId, socketRef]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await getChatMessages(leadId);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await sendChatMessage(leadId, { message: messageText });
      if (res.data.success) {
        // Message will be added via socket or manual update
        // To avoid double add if socket also emits to sender, check logic.
        // Usually server emits to room.
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] z-[100] bg-charcoal/95 backdrop-blur-xl border-l-2 border-primary/20 shadow-2xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-primary/5">
        <div>
          <h3 className="text-white font-black uppercase tracking-tighter text-lg">Chat with Lead</h3>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{leadName || 'Unknown Lead'}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all rounded-sm"
        >
          <span className="material-symbols-outlined font-black">close</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Loading encrypted chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-10 opacity-30">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">chat_bubble</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">No previous messages.</p>
            <p className="text-[9px] text-white/60 mt-2 uppercase">Start the conversation manually below.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender === 'system';
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 border-2 transition-all 
                  ${isMe 
                    ? 'bg-primary border-primary text-charcoal font-bold rounded-tr-none shadow-[4px_4px_0px_rgba(0,0,0,0.3)]' 
                    : 'bg-white/5 border-white/10 text-white rounded-tl-none shadow-[4px_4px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content || msg.body || msg.text}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 px-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW'}
                  </span>
                  {isMe && msg.status && (
                    <span className={`text-[8px] font-black uppercase ${msg.status === 'read' ? 'text-primary' : 'text-white/40'}`}>
                      {msg.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-charcoal shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)] border-t border-white/5">
        <form onSubmit={handleSendMessage} className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="TYPE SECURE MESSAGE..."
            className="w-full bg-white/5 border-2 border-white/10 p-4 pr-14 text-white font-mono text-xs focus:border-primary/50 focus:bg-white/10 outline-none transition-all min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-charcoal flex items-center justify-center border-2 border-primary hover:bg-white hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg"
          >
            <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">send</span>
          </button>
        </form>
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-4 text-center">
          Encrypted via Twilio WhatsApp Gateway
        </p>
      </div>
    </div>
  );
};

export default LeadChatSidebar;
