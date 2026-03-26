import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
            <div className="flex items-center justify-between mb-2">
                <Link to="/chat" className="text-[9px] font-black uppercase tracking-widest text-charcoal/40 hover:text-primary transition-all flex items-center gap-1 group/back">
                    <span className="material-symbols-outlined text-[12px] group-hover/back:-translate-x-0.5 transition-transform">arrow_back</span>
                    Switch Platform
                </Link>
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                    <span className="material-symbols-outlined text-[14px]">forum</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                </div>
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-charcoal m-0 flex items-center gap-2">
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
    const { socket } = useNotifications(); 
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollToBottom = (behavior = "smooth", force = false) => {
        // Sticky logic: if not using 'force' and not at bottom, skip scroll
        if (!force && !isAtBottom) return;
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAtBottom(atBottom);
    };

    const handleMarkAsRead = useCallback(async () => {
        if (!leadId || leadId === 'null') return;
        try {
            await markChatAsRead(leadId);
            if (onMessageReceived) onMessageReceived();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }, [leadId, onMessageReceived]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchMessages = async () => {
            if (!leadId || leadId === 'null') return;
            try {
                const res = await getChatMessages(leadId);
                setMessages(res.data?.data || res.data || []);
                // Force scroll on initial load (force = true)
                setTimeout(() => scrollToBottom("auto", true), 100);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();

        // Mark as read (one-time side effect on leadId change)
        if (leadId && leadId !== 'null') {
            markChatAsRead(leadId).catch(console.error);
        }
        
    }, [leadId]); // Stabilized: only runs when leadId changes

    useEffect(() => {
        // Sticky auto-scroll: Only fires when messages array changes
        scrollToBottom("smooth");
    }, [messages]);

    useEffect(() => {
        if (!socket || !leadId) return;

        socket.emit('join_lead', leadId);

        const handleNewMessage = (payload) => {
            if (payload.leadId === leadId) {
                setMessages(prev => {
                    // Avoid duplicates by real _id
                    if (payload._id && prev.some(m => m._id === payload._id)) return prev;
                    
                    // Check if this is a duplicate of an optimistic message
                    // (optimistic messages have numeric string _ids like Date.now())
                    const isOutbound = payload.sender === 'system' || payload.sender === 'agent' || payload.sender === 'builder';
                    if (isOutbound) {
                        // Find and replace matching optimistic message
                        const optimisticIdx = prev.findIndex(m => 
                            m.content === payload.content && 
                            /^\d+$/.test(m._id) // Optimistic IDs are pure digits
                        );
                        if (optimisticIdx !== -1) {
                            // Replace optimistic with real message
                            const updated = [...prev];
                            updated[optimisticIdx] = payload;
                            return updated;
                        }
                    }
                    
                    return [...prev, payload];
                });
                
                // Track reading on inbound
                markChatAsRead(leadId).catch(console.error);
                
                // Trigger parent update (if exists) without looping
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
    }, [leadId, socket]); // Removed onMessageReceived and handleMarkAsRead to stop loops and handleMarkAsRead

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
            const res = await sendChatMessage(leadId, { message: originalText });
            // Replace optimistic message with real saved message from backend
            const savedMsg = res.data?.data;
            if (savedMsg) {
                setMessages(prev => prev.map(m => 
                    m._id === optimisticMsg._id ? savedMsg : m
                ));
            }
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
                            Lead #{leadId ? leadId.substring(0, 6) : '...'}...
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
    const { leadId: urlLeadId } = useParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLeadId, setActiveLeadId] = useState(urlLeadId && urlLeadId !== 'null' ? urlLeadId : null);
    const { socket } = useNotifications(); 

    // Sync state with URL parameter (deep linking)
    useEffect(() => {
        const sanitizedId = urlLeadId && urlLeadId !== 'null' ? urlLeadId : null;
        setActiveLeadId(sanitizedId);
    }, [urlLeadId]);

    const handleSelectLead = (id) => {
        setActiveLeadId(id);
        if (id && id !== 'null') {
            navigate(`/chat/whatsapp/${id}`);
        } else {
            navigate('/chat/whatsapp');
        }
    };

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
    }, [socket, fetchConversations]);

    return (
        <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white border border-charcoal/10 rounded-xl shadow-sm my-0 mx-0">
            <div className="w-1/3 min-w-[280px] max-w-[360px] hidden md:flex flex-col">
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={handleSelectLead} 
                    loading={isLoading}
                />
            </div>
            
            {/* Mobile View Sidebar (show only if no active lead) */}
            <div className={`w-full md:hidden flex-col ${activeLeadId ? 'hidden' : 'flex'}`}>
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={handleSelectLead} 
                    loading={isLoading}
                />
            </div>
            
            {/* Chat Window Container */}
            <div className={`flex-1 flex flex-col min-w-0 ${!activeLeadId ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                {activeLeadId && (
                    <div className="md:hidden bg-white border-b border-charcoal/10 p-2 flex items-center shrink-0">
                        <button 
                            onClick={() => handleSelectLead(null)}
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
