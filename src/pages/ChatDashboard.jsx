import {
    useState,
    useEffect,
    useRef,
    useCallback,
    memo,
} from 'react';

import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom';

import {
    getChatConversations,
    getChatMessages,
    sendChatMessage,
    markChatAsRead,
    listWAPhoneNumbers,
} from '../api';

import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const SYSTEM_SENDERS = [
    'system',
    'agent',
    'builder',
    'service_user',
    'ai',
];



const formatTime = (date) => {
    try {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '--:--';
    }
};

const EmptyChatPlaceholder = memo(() => (
    <div
        className="
            flex-1
            flex
            flex-col
            items-center
            justify-center
            bg-slate-50
            dark:bg-[#0B1120]
            text-slate-400
            transition-colors
        "
    >
        <div
            className="
                w-24
                h-24
                rounded-full
                bg-white
                dark:bg-white/5
                border
                border-slate-200
                dark:border-white/10
                flex
                items-center
                justify-center
                mb-6
                shadow-sm
            "
        >
            <span className="material-symbols-outlined text-[48px] opacity-30">
                forum
            </span>
        </div>

        <h3
            className="
                text-lg
                font-black
                uppercase
                tracking-[0.2em]
                text-slate-700
                dark:text-slate-200
                mb-2
            "
        >
            Select a Conversation
        </h3>

        <p
            className="
                text-sm
                text-slate-500
                dark:text-slate-400
            "
        >
            Click on a lead to start chatting
        </p>
    </div>
));

const ChatMessage = memo(({ msg }) => {
    const isSystem = SYSTEM_SENDERS.includes(msg.sender);

    return (
        <div
            className={`flex w-full ${
                isSystem
                    ? 'justify-end'
                    : 'justify-start'
            }`}
        >
            <div
                className={`flex max-w-[92%] sm:max-w-[80%] gap-2 items-end ${
                    isSystem
                        ? 'flex-row-reverse'
                        : 'flex-row'
                }`}
            >
                {!isSystem && (
                    <div
                        className="
                            hidden
                            sm:flex
                            w-8
                            h-8
                            rounded-full
                            bg-slate-200
                            dark:bg-white/10
                            items-center
                            justify-center
                            text-slate-500
                            dark:text-slate-300
                            shrink-0
                        "
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            person
                        </span>
                    </div>
                )}

                <div
                    className={`
                        px-4
                        py-3
                        rounded-2xl
                        shadow-sm
                        border
                        ${
                            isSystem
                                ? `
                                    bg-primary/10
                                    border-primary/10
                                    text-slate-800
                                    dark:text-white
                                    rounded-br-md
                                `
                                : `
                                    bg-white
                                    dark:bg-[#1E293B]
                                    border-slate-200
                                    dark:border-white/10
                                    text-slate-800
                                    dark:text-slate-100
                                    rounded-bl-md
                                `
                        }
                    `}
                >
                    {msg.sender === 'ai' && (
                        <div className="flex items-center gap-1 mb-1 opacity-60">
                            <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                            <span className="text-[9px] uppercase tracking-widest font-black">AI</span>
                        </div>
                    )}

                    {msg.messageType === 'template' && (
                        <div
                            className="
                                flex
                                items-center
                                gap-1
                                mb-1
                                opacity-60
                            "
                        >
                            <span className="material-symbols-outlined text-[12px]">
                                smart_toy
                            </span>

                            <span
                                className="
                                    text-[9px]
                                    uppercase
                                    tracking-widest
                                    font-black
                                "
                            >
                                Template
                            </span>
                        </div>
                    )}

                    <p
                        className="
                            text-[13px]
                            leading-relaxed
                            whitespace-pre-wrap
                            break-words
                        "
                    >
                        {msg.content}
                    </p>

                    <div
                        className="
                            flex
                            items-center
                            justify-end
                            gap-1
                            mt-2
                            opacity-60
                        "
                    >
                        <span
                            className="
                                text-[10px]
                                font-bold
                            "
                        >
                            {formatTime(msg.createdAt)}
                        </span>

                        {isSystem && msg.deliveryStatus === 'sent' && (
                            <span className="material-symbols-outlined text-[14px] text-slate-400">check</span>
                        )}
                        {isSystem && msg.deliveryStatus === 'delivered' && (
                            <span className="material-symbols-outlined text-[14px] text-slate-400">done_all</span>
                        )}
                        {isSystem && msg.deliveryStatus === 'read' && (
                            <span className="material-symbols-outlined text-[14px] text-blue-500">done_all</span>
                        )}
                        {isSystem && msg.deliveryStatus === 'failed' && (
                            <span className="material-symbols-outlined text-[14px] text-red-500">error</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

const ChatSidebar = memo(
    ({
        conversations,
        activeLeadId,
        onSelect,
        loading,
        activeWANumber,
    }) => (
        <div
            className="
                flex
                flex-col
                h-full
                bg-white
                dark:bg-[#0F172A]
                border-r
                border-slate-200
                dark:border-white/10
            "
        >
            {/* Header */}
            <div
                className="
                    p-4
                    border-b
                    border-slate-200
                    dark:border-white/10
                    bg-slate-50
                    dark:bg-white/[0.03]
                    shrink-0
                "
            >
                <div
                    className="
                        flex
                        items-center
                        justify-between
                        mb-3
                    "
                >
                    <Link
                        to="/chat"
                        className="
                            flex
                            items-center
                            gap-1
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.15em]
                            text-slate-400
                            hover:text-primary
                            transition-colors
                        "
                    >
                        <span className="material-symbols-outlined text-[14px]">
                            arrow_back
                        </span>

                        Switch Platform
                    </Link>

                    <div
                        className="
                            flex
                            items-center
                            gap-1
                            text-green-500
                        "
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                        <span
                            className="
                                text-[9px]
                                uppercase
                                font-black
                                tracking-widest
                            "
                        >
                            Live
                        </span>
                    </div>
                </div>

                <h2
                    className="
                        text-sm
                        font-black
                        uppercase
                        tracking-[0.2em]
                        text-slate-800
                        dark:text-white
                    "
                >
                    Conversations
                </h2>

                {/* Active WhatsApp number indicator */}
                {activeWANumber && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">chat</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 truncate">
                                {activeWANumber.display_phone_number || activeWANumber.displayPhoneNumber || activeWANumber.phoneNumberId}
                            </p>
                            {(activeWANumber.verified_name || activeWANumber.verifiedName) && (
                                <p className="text-[9px] text-emerald-500/70 truncate">
                                    {activeWANumber.verified_name || activeWANumber.verifiedName}
                                </p>
                            )}
                        </div>
                        {activeWANumber.isDefault && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Default</span>
                        )}
                    </div>
                )}
                {activeWANumber === null && (
                    <Link to="/whatsapp-setup"
                        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">warning</span>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">No WhatsApp connected — Setup</p>
                    </Link>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div
                        className="
                            flex
                            flex-col
                            items-center
                            justify-center
                            h-full
                            gap-4
                        "
                    >
                        <div
                            className="
                                w-10
                                h-10
                                rounded-full
                                border-4
                                border-primary
                                border-t-transparent
                                animate-spin
                            "
                        />

                        <span
                            className="
                                text-[10px]
                                uppercase
                                tracking-[0.2em]
                                font-black
                                text-slate-400
                            "
                        >
                            Loading
                        </span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div
                        className="
                            flex
                            items-center
                            justify-center
                            h-full
                            text-sm
                            text-slate-400
                            dark:text-slate-500
                        "
                    >
                        No conversations
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/5">
                        {conversations.map((conv) => {
                            const displayName =
                                conv.lead.first_name ||
                                conv.lead.last_name
                                    ? `${conv.lead.first_name || ''} ${
                                          conv.lead.last_name ||
                                          ''
                                      }`.trim()
                                    : conv.lead
                                          .phone_number;

                            const active =
                                activeLeadId ===
                                conv.lead.id;

                            return (
                                <li
                                    key={conv.lead.id}
                                    onClick={() =>
                                        onSelect(
                                            conv.lead.id
                                        )
                                    }
                                    className={`
                                        cursor-pointer
                                        transition-all
                                        border-l-4
                                        p-4
                                        hover:bg-slate-50
                                        dark:hover:bg-white/[0.03]
                                        ${
                                            active
                                                ? `
                                                    border-primary
                                                    bg-primary/5
                                                    dark:bg-primary/10
                                                `
                                                : `
                                                    border-transparent
                                                `
                                        }
                                    `}
                                >
                                    <div
                                        className="
                                            flex
                                            items-start
                                            justify-between
                                            gap-3
                                            mb-1
                                        "
                                    >
                                        <h4
                                            className="
                                                text-sm
                                                font-bold
                                                text-slate-800
                                                dark:text-slate-100
                                                truncate
                                            "
                                        >
                                            {displayName}
                                        </h4>

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                items-end
                                                gap-1
                                                shrink-0
                                            "
                                        >
                                            <span
                                                className="
                                                    text-[10px]
                                                    text-slate-400
                                                "
                                            >
                                                {formatTime(
                                                    conv
                                                        .latestMessage
                                                        .createdAt
                                                )}
                                            </span>

                                            {conv.unreadCount >
                                                0 &&
                                                !active && (
                                                    <div
                                                        className="
                                                            px-2
                                                            py-0.5
                                                            rounded-full
                                                            bg-primary
                                                            text-white
                                                            text-[9px]
                                                            font-black
                                                        "
                                                    >
                                                        {
                                                            conv.unreadCount
                                                        }
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    <p
                                        className="
                                            text-[12px]
                                            text-slate-500
                                            dark:text-slate-400
                                            truncate
                                        "
                                    >
                                        {
                                            conv.latestMessage
                                                .content
                                        }
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
);

const ChatWindow = ({
    leadId,
    leadName,
    onMessageReceived,
}) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] =
        useState('');
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [waTemplates, setWaTemplates] = useState([]);

    const messagesEndRef = useRef(null);

    const { socket } = useNotifications();

    const scrollToBottom = (
        behavior = 'smooth'
    ) => {
        messagesEndRef.current?.scrollIntoView({
            behavior,
        });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!leadId) return;

            try {
                const res =
                    await getChatMessages(
                        leadId
                    );

                setMessages(
                    res.data?.data ||
                        res.data ||
                        []
                );

                setTimeout(() => {
                    scrollToBottom('auto');
                }, 100);
            } catch {}
        };

        fetchMessages();

        if (leadId) {
            markChatAsRead(leadId).catch(
                console.error
            );
        }
    }, [leadId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket || !leadId) return;

        socket.emit('join_lead', leadId);

        const handleNewMessage = (
            payload
        ) => {
            if (
                payload &&
                payload.leadId === leadId
            ) {
                setMessages((prev) => {
                    if (
                        payload._id &&
                        prev.some(
                            (m) =>
                                m._id ===
                                payload._id
                        )
                    ) {
                        return prev;
                    }

                    return [
                        ...prev,
                        payload,
                    ];
                });

                markChatAsRead(
                    leadId
                ).catch(console.error);

                onMessageReceived?.();
            }
        };

        socket.on(
            'new_chat_message',
            handleNewMessage
        );

        const handleWhatsappUpdate = (payload) => {
            if (payload && payload.leadId === leadId && payload.wamid) {
                setMessages(prev => prev.map(m =>
                    m.wamid === payload.wamid
                        ? { ...m, deliveryStatus: payload.whatsappData?.deliveryStatus || payload.deliveryStatus }
                        : m
                ));
            }
        };
        socket.on('whatsapp_update', handleWhatsappUpdate);

        return () => {
            socket.off(
                'new_chat_message',
                handleNewMessage
            );
            socket.off('whatsapp_update', handleWhatsappUpdate);
        };
    }, [
        socket,
        leadId,
        onMessageReceived,
    ]);

    const fetchWATemplates = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';
            const res = await fetch(`${API_BASE}/api/whatsapp/templates`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setWaTemplates(data.data.filter(t => t.status === 'APPROVED'));
        } catch {}
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!inputText.trim()) return;

        const originalText = inputText;

        const optimisticMsg = {
            _id: Date.now().toString(),
            leadId,
            content: originalText,
            sender: 'agent',
            createdAt:
                new Date().toISOString(),
        };

        setMessages((prev) => [
            ...prev,
            optimisticMsg,
        ]);

        setInputText('');

        try {
            const res =
                await sendChatMessage(
                    leadId,
                    {
                        message:
                            originalText,
                    }
                );

            const savedMsg =
                res.data?.data;

            if (savedMsg) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id ===
                        optimisticMsg._id
                            ? savedMsg
                            : m
                    )
                );
            }

            onMessageReceived?.();
        } catch {
            setMessages((prev) =>
                prev.filter(
                    (m) =>
                        m._id !==
                        optimisticMsg._id
                )
            );

            setInputText(originalText);
        }
    };

    return (
        <>
        <div
            className="
                flex
                flex-col
                h-full
                bg-[#efeae2]
                dark:bg-[#0B1120]
            "
        >
            {/* Header */}
            <div
                className="
                    px-4
                    py-3
                    border-b
                    border-slate-200
                    dark:border-white/10
                    bg-white
                    dark:bg-[#0F172A]
                    flex
                    items-center
                    justify-between
                    shrink-0
                "
            >
                <div className="flex items-center gap-3">
                    <div
                        className="
                            w-10
                            h-10
                            rounded-full
                            bg-primary/10
                            flex
                            items-center
                            justify-center
                            text-primary
                        "
                    >
                        <span className="material-symbols-outlined">
                            person
                        </span>
                    </div>

                    <div>
                        <h3
                            className="
                                text-sm
                                font-black
                                uppercase
                                tracking-[0.15em]
                                text-slate-800
                                dark:text-white
                            "
                        >
                            {leadName ||
                                'Unknown Lead'}
                        </h3>

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                mt-1
                            "
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                            <span
                                className="
                                    text-[10px]
                                    uppercase
                                    font-bold
                                    tracking-widest
                                    text-slate-400
                                "
                            >
                                Active Chat
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                className="
                    flex-1
                    overflow-y-auto
                    p-4
                    flex
                    flex-col
                    gap-4
                "
            >
                {messages.length === 0 ? (
                    <div
                        className="
                            flex-1
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <div
                            className="
                                px-4
                                py-2
                                rounded-full
                                bg-white/70
                                dark:bg-white/5
                                border
                                border-slate-200
                                dark:border-white/10
                                text-[10px]
                                uppercase
                                tracking-widest
                                text-slate-400
                            "
                        >
                            No messages yet
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg._id}
                            msg={msg}
                        />
                    ))
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                className="
                    p-3
                    border-t
                    border-slate-200
                    dark:border-white/10
                    bg-white
                    dark:bg-[#0F172A]
                    shrink-0
                "
            >
                <form
                    onSubmit={handleSend}
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) =>
                            setInputText(
                                e.target.value
                            )
                        }
                        placeholder="Type a message..."
                        className="
                            flex-1
                            px-4
                            py-3
                            rounded-full
                            border
                            border-slate-200
                            dark:border-white/10
                            bg-slate-100
                            dark:bg-white/5
                            text-slate-800
                            dark:text-white
                            placeholder:text-slate-400
                            focus:outline-none
                            focus:ring-2
                            focus:ring-primary/20
                        "
                    />

                    <button
                        type="button"
                        onClick={() => { fetchWATemplates(); setShowTemplatePicker(true); }}
                        title="Send template"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">description</span>
                    </button>

                    <button
                        type="submit"
                        disabled={
                            !inputText.trim()
                        }
                        className="
                            w-12
                            h-12
                            rounded-full
                            bg-primary
                            text-white
                            flex
                            items-center
                            justify-center
                            shadow-lg
                            transition-all
                            hover:scale-105
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        <span className="material-symbols-outlined">
                            send
                        </span>
                    </button>
                </form>
            </div>

        </div>

        {showTemplatePicker && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
                onClick={() => setShowTemplatePicker(false)}>
                <div className="bg-white dark:bg-[#0F172A] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[60vh] overflow-y-auto p-5 shadow-2xl"
                    onClick={e => e.stopPropagation()}>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-slate-800 dark:text-white">Select Template</h3>
                    {waTemplates.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">No approved templates found</p>
                    ) : (
                        <div className="space-y-2">
                            {waTemplates.map(t => (
                                <button key={t.id || t.name} type="button"
                                    onClick={async () => {
                                        setShowTemplatePicker(false);
                                        const content = `[Template: ${t.name}]`;
                                        const optimistic = {
                                            _id: Date.now().toString(), leadId,
                                            content, sender: 'system',
                                            messageType: 'template', templateName: t.name,
                                            createdAt: new Date().toISOString()
                                        };
                                        setMessages(prev => [...prev, optimistic]);
                                        try {
                                            await sendChatMessage(leadId, { message: content });
                                            onMessageReceived?.();
                                        } catch {
                                            setMessages(prev => prev.filter(m => m._id !== optimistic._id));
                                        }
                                    }}
                                    className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{t.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{t.category} • {t.language}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    );
};

export default function ChatDashboard() {
    const { leadId: urlLeadId } =
        useParams();

    const navigate = useNavigate();

    const [conversations, setConversations] =
        useState([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        activeLeadId,
        setActiveLeadId,
    ] = useState(
        urlLeadId &&
            urlLeadId !== 'null'
            ? urlLeadId
            : null
    );

    // Active WhatsApp number (default phone from connected account)
    // null = not loaded yet, false = no number connected
    const [activeWANumber, setActiveWANumber] = useState(undefined);

    const { socket } =
        useNotifications();

    const { user } = useAuth();

    // Load the owner's connected WhatsApp numbers on mount
    useEffect(() => {
        listWAPhoneNumbers()
            .then(res => {
                const numbers = res.data?.data || [];
                // Prefer the default number, fall back to first
                const defaultNum = numbers.find(n => n.isDefault) || numbers[0];
                setActiveWANumber(defaultNum || null);
            })
            .catch(() => setActiveWANumber(null));
    }, []);

    useEffect(() => {
        const sanitizedId =
            urlLeadId &&
            urlLeadId !== 'null'
                ? urlLeadId
                : null;

        setActiveLeadId(sanitizedId);
    }, [urlLeadId]);

    const handleSelectLead = (id) => {
        setActiveLeadId(id);

        if (id) {
            navigate(
                `/chat/whatsapp/${id}`
            );
        } else {
            navigate('/chat/whatsapp');
        }
    };

    const fetchConversations =
        useCallback(
            async (quiet = false) => {
                try {
                    if (!quiet) {
                        setIsLoading(true);
                    }

                    const res =
                        await getChatConversations(
                            user?.id,
                            user?.role
                        );

                    setConversations(
                        res.data
                    );
                } catch {
                } finally {
                    setIsLoading(false);
                }
            },
            [user]
        );

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!socket) return;

        const handleRefresh = () => {
            fetchConversations(true);
        };

        socket.on(
            'new_chat_message',
            handleRefresh
        );

        socket.on(
            'chat_list_update',
            handleRefresh
        );

        return () => {
            socket.off(
                'new_chat_message',
                handleRefresh
            );

            socket.off(
                'chat_list_update',
                handleRefresh
            );
        };
    }, [socket, fetchConversations]);

    return (
        <div
            className="
                flex
                h-[calc(100vh-100px)]
                sm:h-[calc(100vh-120px)]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                dark:border-white/10
                bg-white
                dark:bg-[#0F172A]
                shadow-sm
            "
        >
            {/* Desktop Sidebar */}
            <div
                className="
                    hidden
                    md:flex
                    w-[320px]
                    shrink-0
                    border-r
                    border-slate-200/80
                    dark:border-white/10
                    bg-white
                    dark:bg-[#0F172A]
                "
            >
                <ChatSidebar
                    conversations={
                        conversations
                    }
                    activeLeadId={
                        activeLeadId
                    }
                    onSelect={
                        handleSelectLead
                    }
                    loading={isLoading}
                    activeWANumber={activeWANumber}
                />
            </div>

            {/* Mobile Sidebar */}
            <div
                className={`
                    w-full
                    md:hidden
                    ${
                        activeLeadId
                            ? 'hidden'
                            : 'flex'
                    }
                `}
            >
                <ChatSidebar
                    conversations={
                        conversations
                    }
                    activeLeadId={
                        activeLeadId
                    }
                    onSelect={
                        handleSelectLead
                    }
                    loading={isLoading}
                    activeWANumber={activeWANumber}
                />
            </div>

            {/* Chat Window */}
            <div
                className={`
                    flex-1
                    min-w-0
                    ${
                        !activeLeadId
                            ? 'hidden md:flex'
                            : 'flex'
                    }
                `}
            >
                {activeLeadId ? (
                    <div className="flex flex-col w-full">
                        {/* Mobile Header */}
                        <div
                            className="
                                md:hidden
                                border-b
                                border-slate-200
                                dark:border-white/10
                                bg-white
                                dark:bg-[#0F172A]
                                p-2
                            "
                        >
                            <button
                                onClick={() =>
                                    handleSelectLead(
                                        null
                                    )
                                }
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-slate-500
                                    hover:text-primary
                                    transition-colors
                                "
                            >
                                <span className="material-symbols-outlined">
                                    arrow_back
                                </span>

                                <span
                                    className="
                                        text-[10px]
                                        font-black
                                        uppercase
                                        tracking-[0.15em]
                                    "
                                >
                                    Conversations
                                </span>
                            </button>
                        </div>

                        <ChatWindow
                            leadId={
                                activeLeadId
                            }
                            leadName={(() => {
                                const conv =
                                    conversations.find(
                                        (
                                            c
                                        ) =>
                                            c
                                                .lead
                                                .id ===
                                            activeLeadId
                                    );

                                if (!conv)
                                    return null;

                                return conv
                                    .lead
                                    .first_name ||
                                    conv
                                        .lead
                                        .last_name
                                    ? `${
                                          conv
                                              .lead
                                              .first_name ||
                                          ''
                                      } ${
                                          conv
                                              .lead
                                              .last_name ||
                                          ''
                                      }`.trim()
                                    : conv
                                          .lead
                                          .phone_number;
                            })()}
                            onMessageReceived={() =>
                                fetchConversations(
                                    true
                                )
                            }
                        />
                    </div>
                ) : (
                    <EmptyChatPlaceholder />
                )}
            </div>
        </div>
    );
}