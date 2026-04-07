import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmailSidebar from '../components/email/EmailSidebar';
import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';
import EmailCompose from '../components/email/EmailCompose';
import { getEmailFolder, getEmailById, sendEmail } from '../api';
import { useNotifications } from '../context/NotificationContext';

const EmailDashboardPage = () => {
    const { socket } = useNotifications();
    const { toasts, dismissToast, addToast } = useNotifications();
    const { leadId: initialLeadId } = useParams();
    const navigate = useNavigate();

    // App State
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [composeConfig, setComposeConfig] = useState(null); // { leadId, replyTo }
    const [search, setSearch] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [mobileView, setMobileView] = useState('list'); // 'sidebar', 'list', 'detail'

    // Handle OAuth Callback Notifications
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const status = params.get('status');
        const provider = params.get('provider');

        if (status === 'success') {
            addToast(`Successfully connected to ${provider}`, 'success');
            // Clean up URL
            navigate(window.location.pathname, { replace: true });
        } else if (error) {
            let message = "Failed to connect email account.";
            if (error === 'security_mismatch') message = "Security verification failed. Please try again.";
            if (error === 'insufficient_permissions') message = "Required permissions were not granted.";
            if (error === 'access_denied') message = "Access was denied by the provider.";
            if (error === 'callback_failed') message = "An error occurred during the connection process.";

            addToast(message, 'error');
            // Clean up URL
            navigate(window.location.pathname, { replace: true });
        }
    }, [addToast, navigate]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setMobileView('list');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync mobile view with email selection
    useEffect(() => {
        if (isMobile) {
            if (selectedEmail) {
                setMobileView('detail');
            } else {
                setMobileView('list');
            }
        }
    }, [selectedEmail, isMobile]);

    // Fetch Emails for the active folder
    const fetchEmails = useCallback(async (folder, query = '') => {
        setLoading(true);
        try {
            const { data } = await getEmailFolder(folder, { search: query });
            setEmails(data.emails || []);
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search — waits 300ms after user stops typing before fetching
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const debounceRef = useRef(null);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    // Initial Load & Folder Switch
    useEffect(() => {
        fetchEmails(activeFolder, debouncedSearch);
    }, [activeFolder, debouncedSearch, fetchEmails]);

    // Real-time Updates
    useEffect(() => {
        if (!socket) return;

        const handleNewEmail = ({ folder, email }) => {
            console.log('📧 New email event received:', email);
            if (activeFolder === folder) {
                setEmails(prev => [email, ...prev]);
            }
        };

        socket.on('new_email', handleNewEmail);
        return () => socket.off('new_email', handleNewEmail);
    }, [socket, activeFolder]);

    // Handle Email Selection
    const handleEmailSelect = async (id) => {
        try {
            const { data } = await getEmailById(id);
            setSelectedEmail(data);
            
            // Mark as read in local list if it was unread
            setEmails(prev => prev.map(e => e._id === id ? { ...e, isRead: true } : e));
        } catch (error) {
            console.error('Error fetching email details:', error);
        }
    };

    // Handle Send Logic
    const handleSendEmail = async (payload) => {
        try {
            const { data } = await sendEmail(payload);
            // If we are in "sent" folder, refresh it
            if (activeFolder === 'sent') {
                fetchEmails('sent');
            }
            return data;
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white animate-fade-in relative">
            {/* Left Pane: Navigation */}
            <div className={`
                ${isMobile ? (mobileView === 'sidebar' ? 'fixed inset-0 z-50 bg-white' : 'hidden') : 'block'}
            `}>
                <EmailSidebar 
                    activeFolder={activeFolder} 
                    onFolderChange={(f) => {
                        setActiveFolder(f);
                        setSelectedEmail(null);
                        if (isMobile) setMobileView('list');
                    }} 
                    onCompose={() => setComposeConfig({})} 
                    onClose={() => setMobileView('list')}
                    isMobile={isMobile}
                />
            </div>

            {/* Middle Pane: List View */}
            <div className={`
                flex-grow h-full overflow-hidden
                ${isMobile && mobileView !== 'list' ? 'hidden' : 'block'}
            `}>
                <EmailList 
                    folder={activeFolder}
                    emails={emails}
                    activeId={selectedEmail?._id}
                    onEmailSelect={handleEmailSelect}
                    loading={loading}
                    onRefresh={() => fetchEmails(activeFolder, search)}
                    search={search}
                    onSearch={setSearch}
                    onMenuClick={() => setMobileView('sidebar')}
                    isMobile={isMobile}
                />
            </div>

            {/* Right Pane: Detail View */}
            <div className={`
                flex-grow h-full overflow-hidden
                ${isMobile ? (mobileView === 'detail' ? 'fixed inset-0 z-40 bg-white' : 'hidden') : 'block'}
            `}>
                <EmailDetail 
                    email={selectedEmail} 
                    onClose={() => setSelectedEmail(null)}
                    onDelete={(id) => console.log('Delete logic here')}
                    onReply={(email) => setComposeConfig({ replyTo: email, leadId: email.leadId?._id })}
                    isMobile={isMobile}
                />
            </div>

            {/* Floating Compose Window */}
            {composeConfig && (
                <div className={`${isMobile ? 'fixed inset-0 z-[60] bg-white' : ''}`}>
                    <EmailCompose 
                        {...composeConfig}
                        onClose={() => setComposeConfig(null)}
                        onSend={handleSendEmail}
                        isMobile={isMobile}
                    />
                </div>
            )}
        </div>
    );
};

export default EmailDashboardPage;
