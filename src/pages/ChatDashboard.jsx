/**
 * ChatDashboard — Layout orchestrator for the WhatsApp Chat UI
 *
 * Responsibilities:
 * - State management (conversations, messages, pagination cursors, UI state)
 * - Socket.IO real-time event handling
 * - API calls with cursor-based pagination
 * - Optimistic message rendering with rollback
 * - Three-column responsive layout composition
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    getChatConversations,
    getChatMessages,
    sendChatMessage,
    markChatAsRead,
    listWAPhoneNumbers,
} from '../api';
import leadsApi from '../api';

import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { ConversationSidebar, MessagePanel, ContactInfoPanel, BulkActionToolbar, TemplatePicker } from '../components/chat';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONVERSATIONS_PAGE_SIZE = 50;
const MESSAGES_PAGE_SIZE = 100;
const TYPING_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// EmptyChatPlaceholder — small inline component (kept per task instructions)
// ---------------------------------------------------------------------------
const EmptyChatPlaceholder = memo(() => (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120] text-slate-400 transition-colors">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[48px] opacity-30">forum</span>
        </div>
        <h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200 mb-2">
            Select a Conversation
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
            Click on a lead to start chatting
        </p>
    </div>
));

// ---------------------------------------------------------------------------
// ChatDashboard — Main export
// ---------------------------------------------------------------------------
export default function ChatDashboard() {
    const { leadId: urlLeadId } = useParams();
    const navigate = useNavigate();
    const { socket } = useNotifications();
    const { user } = useAuth();

    // -----------------------------------------------------------------------
    // State: Conversations (with cursor-based pagination)
    // -----------------------------------------------------------------------
    const [conversations, setConversations] = useState([]);
    const [convCursor, setConvCursor] = useState(null);
    const [convHasMore, setConvHasMore] = useState(true);
    const [convLoading, setConvLoading] = useState(true);

    // -----------------------------------------------------------------------
    // State: Messages (with cursor-based pagination)
    // -----------------------------------------------------------------------
    const [messages, setMessages] = useState([]);
    const [msgCursor, setMsgCursor] = useState(null);
    const [msgHasMore, setMsgHasMore] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);

    // -----------------------------------------------------------------------
    // State: UI
    // -----------------------------------------------------------------------
    const [activeLeadId, setActiveLeadId] = useState(
        urlLeadId && urlLeadId !== 'null' ? urlLeadId : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
    const [typingPerLead, setTypingPerLead] = useState({});
    const [integrationHealth, setIntegrationHealth] = useState('healthy');
    const [activeWANumber, setActiveWANumber] = useState(undefined);
    const [campaignProgress, setCampaignProgress] = useState(null);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // -----------------------------------------------------------------------
    // State: Contact Info Panel
    // -----------------------------------------------------------------------
    const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
    const [activeLead, setActiveLead] = useState(null);

    // Refs for timers and reconnection logic
    const typingTimers = useRef({});
    const socketReconnectRef = useRef(false);

    // -----------------------------------------------------------------------
    // Fetch lead details when activeLeadId changes (for ContactInfoPanel)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!activeLeadId) {
            setActiveLead(null);
            return;
        }
        let cancelled = false;
        leadsApi.get(`/${activeLeadId}`)
            .then((res) => {
                if (!cancelled) {
                    setActiveLead(res.data?.data || res.data || null);
                }
            })
            .catch(() => {
                if (!cancelled) setActiveLead(null);
            });
        return () => { cancelled = true; };
    }, [activeLeadId]);

    // -----------------------------------------------------------------------
    // Handle adding a note via ContactInfoPanel
    // -----------------------------------------------------------------------
    const handleAddNote = useCallback(async (noteText) => {
        if (!activeLeadId || !noteText.trim()) return;
        try {
            const API_BASE =
                import.meta.env.VITE_API_BASE_URL ||
                'https://lead-filteration-backend-624770114041.asia-south1.run.app';
            const res = await fetch(`${API_BASE}/api/chat/${activeLeadId}/note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: noteText }),
            });
            const data = await res.json();
            if (data.data) {
                setMessages((prev) => [...prev, data.data]);
            }
        } catch {
            // Note save failed — silent fail
        }
    }, [activeLeadId]);

    // -----------------------------------------------------------------------
    // Sync URL param → active lead
    // -----------------------------------------------------------------------
    useEffect(() => {
        const sanitizedId = urlLeadId && urlLeadId !== 'null' ? urlLeadId : null;
        setActiveLeadId(sanitizedId);
    }, [urlLeadId]);

    // -----------------------------------------------------------------------
    // Load WhatsApp phone numbers on mount
    // -----------------------------------------------------------------------
    useEffect(() => {
        listWAPhoneNumbers()
            .then((res) => {
                const numbers = res.data?.data || [];
                const defaultNum = numbers.find((n) => n.isDefault) || numbers[0];
                setActiveWANumber(defaultNum || null);
            })
            .catch(() => setActiveWANumber(null));
    }, []);

    // -----------------------------------------------------------------------
    // API: Fetch conversations (cursor-based pagination)
    // -----------------------------------------------------------------------
    const fetchConversations = useCallback(
        async (cursor = null, append = false) => {
            try {
                if (!append) setConvLoading(true);

                const res = await getChatConversations(user?.id, user?.role, cursor);
                const data = res.data;

                // Support both paginated response shape and flat array (backward compat)
                let items, nextCursor, hasMore;
                if (data && data.data && Array.isArray(data.data)) {
                    items = data.data;
                    nextCursor = data.nextCursor || null;
                    hasMore = data.hasMore !== undefined ? data.hasMore : false;
                } else if (Array.isArray(data)) {
                    items = data;
                    nextCursor = null;
                    hasMore = false;
                } else {
                    items = [];
                    nextCursor = null;
                    hasMore = false;
                }

                if (append) {
                    setConversations((prev) => [...prev, ...items]);
                } else {
                    setConversations(items);
                }
                setConvCursor(nextCursor);
                setConvHasMore(hasMore);
            } catch {
                // Keep existing data on error
            } finally {
                setConvLoading(false);
            }
        },
        [user]
    );

    // Initial conversation load
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Load more conversations (infinite scroll)
    const handleLoadMoreConversations = useCallback(() => {
        if (convHasMore && !convLoading && convCursor) {
            fetchConversations(convCursor, true);
        }
    }, [convHasMore, convLoading, convCursor, fetchConversations]);

    // -----------------------------------------------------------------------
    // API: Fetch messages (cursor-based pagination)
    // -----------------------------------------------------------------------
    const fetchMessages = useCallback(
        async (leadId, cursor = null, prepend = false) => {
            if (!leadId) return;
            try {
                setMsgLoading(true);
                const res = await getChatMessages(leadId, cursor);
                const data = res.data;

                let items, nextCursor, hasMore;
                if (data && data.data && Array.isArray(data.data)) {
                    items = data.data;
                    nextCursor = data.nextCursor || null;
                    hasMore = data.hasMore !== undefined ? data.hasMore : false;
                } else if (Array.isArray(data)) {
                    items = data;
                    nextCursor = null;
                    hasMore = false;
                } else {
                    items = [];
                    nextCursor = null;
                    hasMore = false;
                }

                if (prepend) {
                    setMessages((prev) => [...items, ...prev]);
                } else {
                    setMessages(items);
                }
                setMsgCursor(nextCursor);
                setMsgHasMore(hasMore);
            } catch {
                // Keep existing messages on error
            } finally {
                setMsgLoading(false);
            }
        },
        []
    );

    // Fetch messages when active lead changes
    useEffect(() => {
        if (activeLeadId) {
            setMessages([]);
            setMsgCursor(null);
            setMsgHasMore(true);
            fetchMessages(activeLeadId);
            markChatAsRead(activeLeadId).catch(() => {});
        } else {
            setMessages([]);
            setMsgCursor(null);
            setMsgHasMore(true);
        }
    }, [activeLeadId, fetchMessages]);

    // Load older messages on scroll-up
    const handleLoadOlderMessages = useCallback(() => {
        if (msgHasMore && !msgLoading && activeLeadId) {
            fetchMessages(activeLeadId, msgCursor, true);
        }
    }, [msgHasMore, msgLoading, activeLeadId, msgCursor, fetchMessages]);

    // -----------------------------------------------------------------------
    // API: Send message (optimistic rendering + rollback)
    // -----------------------------------------------------------------------
    const handleSendMessage = useCallback(
        async (text) => {
            if (!text.trim() || !activeLeadId) return;

            const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const optimisticMsg = {
                _id: tempId,
                tempId,
                leadId: activeLeadId,
                content: text,
                sender: 'agent',
                messageType: 'text',
                createdAt: new Date().toISOString(),
                deliveryStatus: null,
            };

            setMessages((prev) => [...prev, optimisticMsg]);

            try {
                const res = await sendChatMessage(activeLeadId, { message: text });
                const savedMsg = res.data?.data;

                if (savedMsg) {
                    setMessages((prev) =>
                        prev.map((m) => (m._id === tempId ? savedMsg : m))
                    );
                }
                // Refresh sidebar to show latest message preview
                fetchConversations();
            } catch {
                // Rollback: remove optimistic message
                setMessages((prev) => prev.filter((m) => m._id !== tempId));
            }
        },
        [activeLeadId, fetchConversations]
    );

    // -----------------------------------------------------------------------
    // API: Send template (optimistic pattern)
    // -----------------------------------------------------------------------
    const handleSendTemplate = useCallback(
        async (templateName) => {
            if (!templateName || !activeLeadId) return;

            const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const content = `[Template: ${templateName}]`;
            const optimisticMsg = {
                _id: tempId,
                tempId,
                leadId: activeLeadId,
                content,
                sender: 'system',
                messageType: 'template',
                templateName,
                createdAt: new Date().toISOString(),
                deliveryStatus: null,
            };

            setMessages((prev) => [...prev, optimisticMsg]);

            try {
                const res = await sendChatMessage(activeLeadId, { message: content });
                const savedMsg = res.data?.data;

                if (savedMsg) {
                    setMessages((prev) =>
                        prev.map((m) => (m._id === tempId ? savedMsg : m))
                    );
                }
                fetchConversations();
            } catch {
                setMessages((prev) => prev.filter((m) => m._id !== tempId));
            }
        },
        [activeLeadId, fetchConversations]
    );

    // -----------------------------------------------------------------------
    // API: Send media
    // -----------------------------------------------------------------------
    const handleSendMedia = useCallback(
        async (file) => {
            if (!file || !activeLeadId) return;

            const API_BASE =
                import.meta.env.VITE_API_BASE_URL ||
                'https://lead-filteration-backend-624770114041.asia-south1.run.app';

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch(`${API_BASE}/api/chat/${activeLeadId}/send-media`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });
                const data = await res.json();
                if (data.data) {
                    setMessages((prev) => [...prev, data.data]);
                }
                fetchConversations();
            } catch {
                // Media upload failed — silent fail (toast can be added later)
            }
        },
        [activeLeadId, fetchConversations]
    );

    // -----------------------------------------------------------------------
    // Socket.IO event handlers
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!socket) return;

        // Join active lead room
        if (activeLeadId) {
            socket.emit('join_lead', activeLeadId);
        }

        // --- new_chat_message ---
        const handleNewMessage = (payload) => {
            if (!payload) return;

            // Update messages if it's the active conversation (deduplicate by _id)
            if (payload.leadId === activeLeadId) {
                setMessages((prev) => {
                    if (payload._id && prev.some((m) => m._id === payload._id)) {
                        return prev;
                    }
                    return [...prev, payload];
                });
                markChatAsRead(activeLeadId).catch(() => {});
            }

            // Update sidebar: move conversation to top, update preview
            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) => (c.lead?.id || c.lead?._id) === payload.leadId
                );
                if (idx === -1) {
                    // New conversation not in list — refetch
                    fetchConversations();
                    return prev;
                }
                const updated = [...prev];
                const conv = { ...updated[idx] };
                conv.latestMessage = {
                    content: payload.content,
                    createdAt: payload.createdAt,
                };
                // Increment unread if not active
                if (payload.leadId !== activeLeadId) {
                    conv.unreadCount = (conv.unreadCount || 0) + 1;
                }
                updated.splice(idx, 1);
                updated.unshift(conv);
                return updated;
            });
        };

        // --- delivery_status_update ---
        const handleDeliveryStatus = (payload) => {
            if (!payload || !payload.wamid) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.wamid === payload.wamid
                        ? { ...m, deliveryStatus: payload.deliveryStatus }
                        : m
                )
            );
        };

        // --- typing_indicator ---
        const handleTyping = (payload) => {
            if (!payload || !payload.leadId) return;
            setTypingPerLead((prev) => ({ ...prev, [payload.leadId]: true }));

            // Auto-clear after 5s
            if (typingTimers.current[payload.leadId]) {
                clearTimeout(typingTimers.current[payload.leadId]);
            }
            typingTimers.current[payload.leadId] = setTimeout(() => {
                setTypingPerLead((prev) => ({ ...prev, [payload.leadId]: false }));
            }, TYPING_TIMEOUT_MS);
        };

        // --- campaign_progress ---
        const handleCampaignProgress = (payload) => {
            if (!payload) return;
            setCampaignProgress(payload);
        };

        // --- integration_health ---
        const handleIntegrationHealth = (payload) => {
            if (!payload) return;
            setIntegrationHealth(payload.status || 'healthy');
        };

        // --- Auto-reconnect: re-join lead room ---
        const handleReconnect = () => {
            if (activeLeadId) {
                socket.emit('join_lead', activeLeadId);
            }
        };

        socket.on('new_chat_message', handleNewMessage);
        socket.on('delivery_status_update', handleDeliveryStatus);
        // Also listen for legacy event name
        socket.on('whatsapp_update', handleDeliveryStatus);
        socket.on('typing_indicator', handleTyping);
        socket.on('campaign_progress', handleCampaignProgress);
        socket.on('integration_health', handleIntegrationHealth);
        socket.on('connect', handleReconnect);

        return () => {
            socket.off('new_chat_message', handleNewMessage);
            socket.off('delivery_status_update', handleDeliveryStatus);
            socket.off('whatsapp_update', handleDeliveryStatus);
            socket.off('typing_indicator', handleTyping);
            socket.off('campaign_progress', handleCampaignProgress);
            socket.off('integration_health', handleIntegrationHealth);
            socket.off('connect', handleReconnect);
        };
    }, [socket, activeLeadId, fetchConversations]);

    // -----------------------------------------------------------------------
    // Navigation: Select a lead
    // -----------------------------------------------------------------------
    const handleSelectLead = useCallback(
        (id) => {
            setActiveLeadId(id);
            if (id) {
                navigate(`/chat/whatsapp/${id}`);
            } else {
                navigate('/chat/whatsapp');
            }
            // Clear unread for selected
            if (id) {
                setConversations((prev) =>
                    prev.map((c) =>
                        (c.lead?.id || c.lead?._id) === id
                            ? { ...c, unreadCount: 0 }
                            : c
                    )
                );
            }
        },
        [navigate]
    );

    // -----------------------------------------------------------------------
    // Bulk mode handlers
    // -----------------------------------------------------------------------
    const handleToggleBulkMode = useCallback(() => {
        setBulkMode((prev) => !prev);
        if (bulkMode) setSelectedLeadIds(new Set()); // exiting: clear selection
    }, [bulkMode]);

    const handleToggleSelect = useCallback((leadId) => {
        setSelectedLeadIds((prev) => {
            const next = new Set(prev);
            if (next.has(leadId)) {
                next.delete(leadId);
            } else {
                next.add(leadId);
            }
            return next;
        });
    }, []);

    // -----------------------------------------------------------------------
    // Bulk send template (bulk-send API endpoint)
    // -----------------------------------------------------------------------
    const handleBulkSendTemplate = useCallback(async (templateName) => {
        if (!templateName || selectedLeadIds.size === 0) return;
        try {
            const API_BASE =
                import.meta.env.VITE_API_BASE_URL ||
                'https://lead-filteration-backend-624770114041.asia-south1.run.app';
            const res = await fetch(`${API_BASE}/api/chat/bulk-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ leadIds: Array.from(selectedLeadIds), templateName }),
            });
            const data = await res.json();
            if (data.campaignId) {
                // Campaign started — progress will come via Socket.IO
                setCampaignProgress({ campaignId: data.campaignId, total: selectedLeadIds.size, queued: selectedLeadIds.size, completed: 0, failed: 0 });
            }
            // Exit bulk mode
            setBulkMode(false);
            setSelectedLeadIds(new Set());
        } catch {
            // Bulk send failed — silent fail
        }
    }, [selectedLeadIds]);

    // -----------------------------------------------------------------------
    // Derived state
    // -----------------------------------------------------------------------
    const activeConv = conversations.find(
        (c) => (c.lead?.id || c.lead?._id) === activeLeadId
    );
    const activeLeadName = activeConv
        ? activeConv.lead?.first_name || activeConv.lead?.last_name
            ? `${activeConv.lead.first_name || ''} ${activeConv.lead.last_name || ''}`.trim()
            : activeConv.lead?.phone_number
        : null;

    const isTypingActive = activeLeadId ? !!typingPerLead[activeLeadId] : false;

    // -----------------------------------------------------------------------
    // Render: Three-column layout
    // -----------------------------------------------------------------------
    return (
        <div className="flex flex-col h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm">
            {/* Integration health banners */}
            {integrationHealth === 'degraded' && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-sm text-amber-800">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>WhatsApp connection issues detected. Some messages may be delayed.</span>
                </div>
            )}
            {integrationHealth === 'disconnected' && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-sm text-red-800">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    <span>WhatsApp disconnected.</span>
                    <a href="/settings/whatsapp" className="font-medium underline ml-1">Reconnect →</a>
                </div>
            )}

            {/* Main three-column layout */}
            <div className="flex flex-1 min-h-0">
            {/* LEFT: ConversationSidebar — 320px desktop, full width mobile */}
            <div
                className={`
                    w-full md:w-[320px] md:flex-shrink-0
                    ${activeLeadId ? 'hidden md:flex' : 'flex'}
                `}
            >
                <ConversationSidebar
                    conversations={conversations}
                    activeLeadId={activeLeadId}
                    onSelect={handleSelectLead}
                    loading={convLoading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    bulkMode={bulkMode}
                    selectedLeadIds={selectedLeadIds}
                    onToggleBulkMode={handleToggleBulkMode}
                    onToggleSelect={handleToggleSelect}
                    onLoadMore={handleLoadMoreConversations}
                    hasMore={convHasMore}
                    integrationHealth={integrationHealth}
                    onNewChat={() => {
                        // Placeholder: will be wired to NewChatDialog in a later task
                    }}
                />
            </div>

            {/* CENTER: MessagePanel — flex-1 */}
            <div
                className={`
                    flex-1 min-w-0 flex flex-col
                    ${!activeLeadId ? 'hidden md:flex' : 'flex'}
                `}
            >
                {activeLeadId ? (
                    <>
                        {/* Mobile back button */}
                        <div className="md:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-2">
                            <button
                                onClick={() => handleSelectLead(null)}
                                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                                    Conversations
                                </span>
                            </button>
                        </div>

                        <MessagePanel
                            leadId={activeLeadId}
                            leadName={activeLeadName}
                            messages={messages}
                            typingActive={isTypingActive}
                            onSendMessage={handleSendMessage}
                            onSendTemplate={() => setShowTemplatePicker(true)}
                            onSendMedia={handleSendMedia}
                            onLoadOlderMessages={handleLoadOlderMessages}
                            hasOlderMessages={msgHasMore}
                            loadingOlder={msgLoading}
                        />
                    </>
                ) : (
                    <EmptyChatPlaceholder />
                )}
            </div>

            {/* RIGHT: ContactInfoPanel */}
            {activeLeadId && (
                <div className="hidden lg:flex flex-shrink-0">
                    <ContactInfoPanel
                        lead={activeLead}
                        onAddNote={handleAddNote}
                        onNavigateToProfile={() => navigate(`/crm/${activeLeadId}`)}
                        collapsed={infoPanelCollapsed}
                        onToggleCollapse={() => setInfoPanelCollapsed((prev) => !prev)}
                    />
                </div>
            )}
            </div>

            {/* Bulk action toolbar */}
            {bulkMode && (
                <BulkActionToolbar
                    selectedCount={selectedLeadIds.size}
                    selectedLeadIds={selectedLeadIds}
                    onSendTemplate={() => setShowTemplatePicker(true)}
                    campaignProgress={campaignProgress}
                    onDeselectAll={() => setSelectedLeadIds(new Set())}
                />
            )}

            {/* Template picker modal (used for both individual send and bulk send) */}
            <TemplatePicker
                open={showTemplatePicker}
                onClose={() => setShowTemplatePicker(false)}
                onSelectTemplate={(name) => {
                    setShowTemplatePicker(false);
                    if (bulkMode && selectedLeadIds.size > 0) {
                        handleBulkSendTemplate(name);
                    } else if (activeLeadId) {
                        handleSendTemplate(name);
                    }
                }}
            />
        </div>
    );
}
