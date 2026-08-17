import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import EmailSidebar from '../components/email/EmailSidebar';
import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';
import EmailCompose from '../components/email/EmailCompose';

import {
    getEmailFolder,
    getEmailById,
    sendEmail,
} from '../api';

import { useNotifications } from '../context/NotificationContext';

const EmailDashboardPage = () => {
    const { socket } = useNotifications();
    const { addToast } = useNotifications();

    const { leadId: initialLeadId } = useParams();

    const navigate = useNavigate();

    // =========================
    // STATE
    // =========================

    const [activeFolder, setActiveFolder] =
        useState('inbox');

    const [emails, setEmails] = useState([]);

    const [selectedEmail, setSelectedEmail] =
        useState(null);

    const [loading, setLoading] = useState(false);

    const [composeConfig, setComposeConfig] =
        useState(null);

    const [search, setSearch] = useState('');

    const [isMobile, setIsMobile] = useState(
        window.innerWidth < 1024
    );

    const [mobileView, setMobileView] =
        useState('list');

    // =========================
    // OAUTH CALLBACK
    // =========================

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        const error = params.get('error');
        const status = params.get('status');
        const provider = params.get('provider');

        if (status === 'success') {
            addToast(
                `Successfully connected to ${provider}`,
                'success'
            );

            navigate(window.location.pathname, {
                replace: true,
            });
        } else if (error) {
            let message =
                'Failed to connect email account.';

            if (error === 'security_mismatch') {
                message =
                    'Security verification failed.';
            }

            if (error === 'insufficient_permissions') {
                message =
                    'Required permissions were not granted.';
            }

            if (error === 'access_denied') {
                message =
                    'Access was denied by the provider.';
            }

            if (error === 'callback_failed') {
                message =
                    'Connection process failed.';
            }

            addToast(message, 'error');

            navigate(window.location.pathname, {
                replace: true,
            });
        }
    }, [addToast, navigate]);

    // =========================
    // RESPONSIVE
    // =========================

    useEffect(() => {
        const handleResize = () => {
            const mobile =
                window.innerWidth < 1024;

            setIsMobile(mobile);

            if (!mobile) {
                setMobileView('list');
            }
        };

        window.addEventListener(
            'resize',
            handleResize
        );

        return () =>
            window.removeEventListener(
                'resize',
                handleResize
            );
    }, []);

    // =========================
    // MOBILE SYNC
    // =========================

    useEffect(() => {
        if (!isMobile) return;

        if (selectedEmail) {
            setMobileView('detail');
        } else {
            setMobileView('list');
        }
    }, [selectedEmail, isMobile]);

    // =========================
    // FETCH EMAILS
    // =========================

    const fetchEmails = useCallback(
        async (folder, query = '') => {
            setLoading(true);

            try {
                const { data } =
                    await getEmailFolder(folder, {
                        search: query,
                    });

                setEmails(data.emails || []);
            } catch (error) {
                console.error(
                    'Error fetching emails:',
                    error
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // =========================
    // DEBOUNCED SEARCH
    // =========================

    const [debouncedSearch, setDebouncedSearch] =
        useState(search);

    const debounceRef = useRef(null);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () =>
            clearTimeout(debounceRef.current);
    }, [search]);

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchEmails(
            activeFolder,
            debouncedSearch
        );
    }, [
        activeFolder,
        debouncedSearch,
        fetchEmails,
    ]);

    // =========================
    // REALTIME SOCKETS
    // =========================

    useEffect(() => {
        if (!socket) return;

        const handleNewEmail = ({
            folder,
            email,
        }) => {
            if (activeFolder === folder) {
                setEmails((prev) => [
                    email,
                    ...prev,
                ]);
            }
        };

        socket.on('new_email', handleNewEmail);

        return () =>
            socket.off(
                'new_email',
                handleNewEmail
            );
    }, [socket, activeFolder]);

    // =========================
    // SELECT EMAIL
    // =========================

    const handleEmailSelect = async (id) => {
        try {
            const { data } =
                await getEmailById(id);

            setSelectedEmail(data);

            setEmails((prev) =>
                prev.map((e) =>
                    e._id === id
                        ? {
                              ...e,
                              isRead: true,
                          }
                        : e
                )
            );
        } catch (error) {
            console.error(
                'Error fetching email:',
                error
            );
        }
    };

    // =========================
    // SEND EMAIL
    // =========================

    const handleSendEmail = async (
        payload
    ) => {
        try {
            const { data } =
                await sendEmail(payload);

            if (activeFolder === 'sent') {
                fetchEmails('sent');
            }

            return data;
        } catch (error) {
            throw error;
        }
    };

    // =========================
    // UI
    // =========================

    return (
        <div
            className="
                h-[calc(100vh-64px)]
                overflow-hidden
                relative

                bg-slate-100
                dark:bg-[#020617]

                text-slate-900
                dark:text-white

                transition-colors
                duration-300
            "
        >
            {/* BACKGROUND */}
            <div
                className="
                    absolute
                    inset-0
                    pointer-events-none
                    overflow-hidden
                "
            >
                <div
                    className="
                        absolute
                        top-[-120px]
                        left-[-120px]
                        w-[320px]
                        h-[320px]
                        rounded-full
                        bg-cyan-500/10
                        blur-3xl
                    "
                />

                <div
                    className="
                        absolute
                        bottom-[-140px]
                        right-[-100px]
                        w-[300px]
                        h-[300px]
                        rounded-full
                        bg-emerald-500/10
                        blur-3xl
                    "
                />
            </div>

            {/* MAIN LAYOUT */}
            <div
                className="
                    relative
                    z-10
                    flex
                    h-full
                    overflow-hidden
                "
            >
                {/* SIDEBAR */}
                <div
                    className={`
                        ${
                            isMobile
                                ? mobileView ===
                                  'sidebar'
                                    ? `
                                        fixed
                                        inset-0
                                        z-50
                                        backdrop-blur-2xl
                                        bg-black/40
                                    `
                                    : 'hidden'
                                : `
                                    block
                                    h-full
                                `
                        }
                    `}
                >
                    <EmailSidebar
                        activeFolder={
                            activeFolder
                        }
                        onFolderChange={(f) => {
                            setActiveFolder(f);

                            setSelectedEmail(
                                null
                            );

                            if (isMobile) {
                                setMobileView(
                                    'list'
                                );
                            }
                        }}
                        onCompose={() =>
                            setComposeConfig({})
                        }
                        onClose={() =>
                            setMobileView(
                                'list'
                            )
                        }
                        isMobile={isMobile}
                    />
                </div>

                {/* EMAIL LIST */}
                <div
                    className={`
                        relative
                        z-20
                        h-full
                        shrink-0
                        transition-all
                        duration-300

                        ${
                            isMobile &&
                            mobileView !==
                                'list'
                                ? 'hidden'
                                : 'flex'
                        }
                    `}
                >
                    <EmailList
                        folder={activeFolder}
                        emails={emails}
                        activeId={
                            selectedEmail?._id
                        }
                        onEmailSelect={
                            handleEmailSelect
                        }
                        loading={loading}
                        onRefresh={() =>
                            fetchEmails(
                                activeFolder,
                                search
                            )
                        }
                        search={search}
                        onSearch={setSearch}
                        onMenuClick={() =>
                            setMobileView(
                                'sidebar'
                            )
                        }
                        isMobile={isMobile}
                    />
                </div>

                {/* EMAIL DETAIL */}
                <div
                    className={`
                        flex-1
                        h-full
                        min-w-0
                        relative

                        ${
                            isMobile
                                ? mobileView ===
                                  'detail'
                                    ? `
                                        fixed
                                        inset-0
                                        z-40
                                    `
                                    : 'hidden'
                                : 'flex'
                        }
                    `}
                >
                    <EmailDetail
                        email={selectedEmail}
                        onClose={() =>
                            setSelectedEmail(
                                null
                            )
                        }
                        onDelete={(id) =>
                            console.log(
                                'Delete logic:',
                                id
                            )
                        }
                        onReply={(email) =>
                            setComposeConfig({
                                replyTo: email,
                                leadId:
                                    email
                                        .leadId
                                        ?._id,
                            })
                        }
                        isMobile={isMobile}
                    />
                </div>
            </div>

            {/* COMPOSE MODAL */}
            {composeConfig && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[120]
                        pointer-events-none
                    "
                >
                    <div className="pointer-events-auto">
                        <EmailCompose
                            {...composeConfig}
                            onClose={() =>
                                setComposeConfig(
                                    null
                                )
                            }
                            onSend={
                                handleSendEmail
                            }
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailDashboardPage;

