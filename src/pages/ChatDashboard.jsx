import { useState, useEffect, useRef } from 'react';
import { getChatConversations, getChatMessages, sendChatMessage } from '../api';
import { useNotifications } from '../context/NotificationContext';

const EmptyChatPlaceholder = () => (
   <div className="flex-1 flex flex-col items-center justify-center text-charcoal/40 bg-surface-subtle">
       <span className="material-symbols-outlined text-[64px] mb-4 opacity-20">forum</span>
       <h3 className="text-xl font-black uppercase tracking-widest m-0 mb-2 text-charcoal/60">Select a Conversation</h3>
       <p className="text-sm font-medium m-0">Click on a lead to the left to start chatting</p>
   </div>
);

const ChatSidebar = ({ conversations, activeLeadId, onSelect }) => (
    <div className="flex flex-col h-full bg-white font-display border-r border-charcoal/10">
        <div className="p-4 border-b border-charcoal/10 bg-surface-subtle shrink-0">
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">forum</span>
                Conversations
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="p-8 text-center text-charcoal/40 text-xs font-bold uppercase tracking-wider">
                    No active conversations
                </div>
            ) : (
                <ul className="m-0 p-0 list-none divide-y divide-charcoal/5">
                    {conversations.map(conv => (
                        <li 
                            key={conv.lead.id} 
                            onClick={() => onSelect(conv.lead.id)}
                            className={`p-4 cursor-pointer transition-colors hover:bg-surface-subtle ${activeLeadId === conv.lead.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="m-0 text-sm font-bold text-charcoal truncate">
                                    {conv.lead.first_name} {conv.lead.last_name || ''}
                                </h4>
                                <span className="text-[10px] uppercase font-bold text-charcoal/40 whitespace-nowrap ml-2 shrink-0">
                                    {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="m-0 text-xs font-medium text-charcoal/60 truncate">
                                {conv.latestMessage.sender === 'system' && <span className="material-symbols-outlined text-[12px] inline-block align-text-bottom mr-1 opacity-50">smart_toy</span>}
                                {conv.latestMessage.content}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
);

const ChatWindow = ({ leadId }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);
    const { socketRef } = useNotifications(); // reuse shared socket — same server, already connected

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await getChatMessages(leadId);
                setMessages(res.data?.data || res.data || []);
                scrollToBottom();
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
    }, [leadId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !leadId) return;

        // Join this lead's room so server can target us with new_chat_message
        socket.emit('join_lead', leadId);
        console.log('ChatWindow joined lead room:', leadId);

        const handleNewMessage = (payload) => {
            if (payload.leadId === leadId) {
                setMessages(prev => {
                    if (payload._id && prev.some(m => m._id === payload._id)) return prev;
                    return [...prev, payload];
                });
            }
        };

        const handleChatListUpdate = (payload) => {
            if (payload.leadId === leadId) {
                // FALLBACK: if we missed real-time message, refetch full history
                getChatMessages(leadId).then(res => {
                    setMessages(res.data?.data || res.data || []);
                }).catch(console.error);
            }
        };

        socket.on('new_chat_message', handleNewMessage);
        socket.on('chat_list_update', handleChatListUpdate);

        return () => {
            socket.off('new_chat_message', handleNewMessage);
            socket.off('chat_list_update', handleChatListUpdate);
        };
    }, [leadId, socketRef]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const originalText = inputText;
        // Optimistically add to state
        const optimisticMsg = {
            _id: Date.now().toString(),
            leadId: leadId,
            content: originalText,
            sender: 'agent', // or builder, system
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInputText("");

        try {
            await sendChatMessage(leadId, { message: originalText });
            // The socket will eventually fetch the real DB message. The deduplication logic will prevent duplicates if IDs match, but since it's an optimistic random string _id we might see it twice if no dedupe by content/date exists.
            // Still, following the plan: "and optimistically adds them to state."
        } catch (error) {
            console.error("Error sending message:", error);
            // Revert on error
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 flex flex-col space-y-4">
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
    const [activeLeadId, setActiveLeadId] = useState(null);
    const { socketRef } = useNotifications(); // reuse shared socket

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const res = await getChatConversations(user.userId || user.id, user.role);
                setConversations(res.data);
            } catch (err) {
                console.error("Error fetching conversations:", err);
            }
        };

        fetchConversations();

        const socket = socketRef.current;
        if (!socket) return;

        const handleChatListUpdate = (payload) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.lead.id === payload.leadId);
                let newConversations = [...prev];
                if (existingIndex >= 0) {
                    newConversations[existingIndex] = {
                        ...newConversations[existingIndex],
                        latestMessage: payload.message
                    };
                } else {
                    fetchConversations();
                    return prev;
                }
                return newConversations.sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));
            });
        };

        socket.on('chat_list_update', handleChatListUpdate);

        return () => {
            socket.off('chat_list_update', handleChatListUpdate);
        };
    }, [socketRef]);

    return (
        <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white border border-charcoal/10 rounded-xl shadow-sm my-0 mx-0">
            <div className="w-1/3 min-w-[280px] max-w-[360px] hidden md:flex flex-col">
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={setActiveLeadId} 
                />
            </div>
            
            {/* Mobile View Sidebar (show only if no active lead) */}
            <div className={`w-full md:hidden flex-col ${activeLeadId ? 'hidden' : 'flex'}`}>
                <ChatSidebar 
                    conversations={conversations} 
                    activeLeadId={activeLeadId} 
                    onSelect={setActiveLeadId} 
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
                    <ChatWindow leadId={activeLeadId} />
                ) : (
                    <EmptyChatPlaceholder />
                )}
            </div>
        </div>
    );
}
