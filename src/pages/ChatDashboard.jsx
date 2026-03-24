import { useState, useEffect, useRef, useCallback } from 'react';
import { getChatConversations, getChatMessages, sendChatMessage, markChatAsRead } from '../api';
import { useNotifications } from '../context/NotificationContext';

const EmptyChatPlaceholder = () => (
   <div className="flex-1 flex flex-col items-center justify-center text-charcoal/40 bg-surface-subtle">
       <span className="material-symbols-outlined text-[64px] mb-4 opacity-20">forum</span>
       <h3 className="text-xl font-black uppercase tracking-widest m-0 mb-2 text-charcoal/60">Select a Conversation</h3>
       <p className="text-sm font-medium m-0">Click on a lead to the left to start chatting</p>
   </div>
);

const ChatSidebar = ({ conversations, activeLeadId, onSelect, loading }) => (
    <div className="flex flex-col h-full bg-white font-display border-r border-charcoal/10">
        <div className="p-4 border-b border-charcoal/10 bg-surface-subtle shrink-0">
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">forum</span>
                Conversations
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-charcoal/30">Loading...</span>
                </div>
            ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-charcoal/40 text-xs font-bold uppercase tracking-wider">
                    No active conversations
                </div>
            ) : (
                <ul className="m-0 p-0 list-none divide-y divide-charcoal/5">
                    {conversations.map(conv => {
                        const displayName = (conv.lead.first_name || conv.lead.last_name) 
                            ? `${conv.lead.first_name || ''} ${conv.lead.last_name || ''}`.trim()
                            : conv.lead.phone_number;
                            
                        return (
                            <li 
                                key={conv.lead.id} 
                                onClick={() => onSelect(conv.lead.id)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-surface-subtle ${activeLeadId === conv.lead.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="m-0 text-sm font-bold text-charcoal truncate pr-2">
                                        {displayName}
                                    </h4>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] uppercase font-bold text-charcoal/40 whitespace-nowrap shrink-0">
                                            {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {conv.unreadCount > 0 && activeLeadId !== conv.lead.id && (
                                            <div className="flex items-center gap-1.5 h-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                                <span className="text-[8px] font-black tracking-widest text-green-600 uppercase">New</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="m-0 text-xs font-medium text-charcoal/60 truncate">
                                    {conv.latestMessage.sender === 'system' && <span className="material-symbols-outlined text-[12px] inline-block align-text-bottom mr-1 opacity-50">smart_toy</span>}
                                    {conv.latestMessage.content}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    </div>
);

const ChatWindow = ({ leadId, onMessageReceived }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const { socketRef } = useNotifications(); 
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollToBottom = (behavior = "smooth") => {
        if (!isAtBottom && behavior === "smooth") return;
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAtBottom(atBottom);
    };

    const handleMarkAsRead = useCallback(async () => {
        if (!leadId) return;
        try {
            await markChatAsRead(leadId);
            if (onMessageReceived) onMessageReceived();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }, [leadId, onMessageReceived]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await getChatMessages(leadId);
                setMessages(res.data?.data || res.data || []);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
        // Do NOT include handleMarkAsRead in deps - it would cause an infinite re-fetch loop
        // because handleMarkAsRead calls onMessageReceived → fetchConversations → re-renders parent
        // → new onMessageReceived ref → handleMarkAsRead recreates → this effect re-runs.
        // markAsRead is a side-effect that should only fire once when leadId changes.
        markChatAsRead(leadId).catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !leadId) return;

        socket.emit('join_lead', leadId);

        const handleNewMessage = (payload) => {
            if (payload.leadId === leadId) {
                setMessages(prev => {
                    if (payload._id && prev.some(m => m._id === payload._id)) return prev;
                    return [...prev, payload];
                });
                
                // Only mark as read if this chat is active
                handleMarkAsRead();
                
                if (onMessageReceived) onMessageReceived();
            }
        };

        const handleChatListUpdate = (payload) => {
            if (payload.leadId === leadId) {
                getChatMessages(leadId).then(res => {
                    setMessages(res.data?.data || res.data || []);
                }).catch(console.error);
                
                if (onMessageReceived) onMessageReceived();
            }
        };

        socket.on('new_chat_message', handleNewMessage);
        socket.on('chat_list_update', handleChatListUpdate);

        return () => {
            socket.off('new_chat_message', handleNewMessage);
            socket.off('chat_list_update', handleChatListUpdate);
        };
    }, [leadId, socketRef, handleMarkAsRead, onMessageReceived]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const originalText = inputText;
        const optimisticMsg = {
            _id: Date.now().toString(),
            leadId: leadId,
            content: originalText,
            sender: 'agent', 
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInputText("");

        try {
            await sendChatMessage(leadId, { message: originalText });
            if (onMessageReceived) onMessageReceived();
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            setInputText(originalText);
        }
    };

    return (
        <div className="flex flex-col h-full font-display bg-[#efeae2] relative min-h-0">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-charcoal/10 shrink-0 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div>
                        <h3 className="m-0 text-sm font-black uppercase tracking-widest text-charcoal">
                            Lead #{leadId.substring(0, 6)}...
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            <span className="text-[9px] uppercase font-bold text-charcoal/40 tracking-widest">Active Chat</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Messages Area */}
            <div 
                className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 flex flex-col space-y-4"
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-white/50 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider text-charcoal/40 border border-charcoal/5">
                            No messages yet. Send a message to start the conversation.
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isSystem = msg.sender === 'system' || msg.sender === 'agent' || msg.sender === 'builder';
                        
                        return (
                            <div key={msg._id || idx} className={`flex w-full ${isSystem ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] sm:max-w-[70%] ${isSystem ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
                                    {!isSystem && (
                                        <div className="w-6 h-6 rounded-full bg-charcoal/10 flex-shrink-0 flex items-center justify-center text-charcoal/50 mb-1 hidden sm:flex">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                        </div>
                                    )}
                                    <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
                                        isSystem 
                                        ? 'bg-[#d9fdd3] text-charcoal rounded-br-sm' 
                                        : 'bg-white text-charcoal rounded-bl-sm border border-charcoal/5'
                                    }`}>
                                        {msg.messageType === 'template' && (
                                            <div className="flex items-center gap-1 mb-1 opacity-60">
                                                <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                                                <span className="text-[9px] font-black uppercase tracking-wider">Template</span>
                                            </div>
                                        )}
                                        <p className="m-0 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className="text-right mt-1.5 -mb-1 flex justify-end items-center gap-1">
                                            <span className="text-[9px] uppercase font-bold text-charcoal/40 tracking-wider">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isSystem && msg.deliveryStatus === 'read' && (
                                                <span className="material-symbols-outlined text-[12px] text-blue-500">done_all</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-charcoal/10 shrink-0 z-10 w-full">
                <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto items-center">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..." 
                        className="flex-1 px-5 py-3.5 bg-surface-subtle border border-charcoal/10 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-charcoal placeholder:text-charcoal/40"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm active:scale-95 flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function ChatDashboard() {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLeadId, setActiveLeadId] = useState(null);
    const { socketRef } = useNotifications(); 

    const fetchConversations = useCallback(async (quiet = false) => {
        try {
            if (!quiet) setIsLoading(true);
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const res = await getChatConversations(user.userId || user.id, user.role);
            setConversations(res.data);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Handle Socket Updates
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleChatListUpdate = () => {
            fetchConversations(true); // Quiet update
        };

        // Also listen for new messages broadly to refresh sidebar
        socket.on('new_chat_message', handleChatListUpdate);
        socket.on('chat_list_update', handleChatListUpdate);

        return () => {
            socket.off('new_chat_message', handleChatListUpdate);
            socket.off('chat_list_update', handleChatListUpdate);
        };
    }, [socketRef, fetchConversations]); // Use the stable ref object, not .current

    return (
        <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white border border-charcoal/10 rounded-xl shadow-sm my-0 mx-0">
            <div className="w-1/3 min-w-[280px] max-w-[360px] hidden md:flex flex-col">
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={setActiveLeadId} 
                    loading={isLoading}
                />
            </div>
            
            {/* Mobile View Sidebar (show only if no active lead) */}
            <div className={`w-full md:hidden flex-col ${activeLeadId ? 'hidden' : 'flex'}`}>
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={setActiveLeadId} 
                    loading={isLoading}
                />
            </div>
            
            {/* Chat Window Container */}
            <div className={`flex-1 flex flex-col min-w-0 ${!activeLeadId ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                {activeLeadId && (
                    <div className="md:hidden bg-white border-b border-charcoal/10 p-2 flex items-center shrink-0">
                        <button 
                            onClick={() => setActiveLeadId(null)}
                            className="flex items-center text-charcoal/60 hover:text-primary transition-colors p-2"
                        >
                            <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Conversations</span>
                        </button>
                    </div>
                )}
                
                {activeLeadId ? (
                    <ChatWindow 
                        leadId={activeLeadId} 
                        onMessageReceived={() => fetchConversations(true)}
                    />
                ) : (
                    <EmptyChatPlaceholder />
                )}
            </div>
        </div>
    );
}
