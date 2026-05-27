import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    getEmailConnectionStatus,
    getGoogleAuthUrl,
    getMicrosoftAuthUrl,
    testEmailConnection,
    disconnectEmail,
} from '../../api';

const folders = [
    {
        id: 'inbox',
        name: 'Inbox',
        icon: 'inbox',
        color: 'text-cyan-500 dark:text-cyan-400',
    },
    {
        id: 'sent',
        name: 'Sent',
        icon: 'send',
        color: 'text-emerald-500 dark:text-emerald-400',
    },
    {
        id: 'drafts',
        name: 'Drafts',
        icon: 'drafts',
        color: 'text-amber-500 dark:text-amber-400',
    },
    {
        id: 'trash',
        name: 'Trash',
        icon: 'delete',
        color: 'text-red-500 dark:text-red-400',
    },
    {
        id: 'junk',
        name: 'Spam',
        icon: 'report',
        color: 'text-orange-500 dark:text-orange-400',
    },
];

const EmailSidebar = ({
    activeFolder,
    onFolderChange,
    onCompose,
    onClose,
    isMobile,
}) => {
    const { user } = useAuth();

    const [connection, setConnection] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const ownerId = user?.id;

    const fetchStatus = async () => {
        try {
            const { data } = await getEmailConnectionStatus();

            setConnection(data.connection);
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to fetch email status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleConnect = (provider) => {
        const url =
            provider === 'google'
                ? getGoogleAuthUrl(ownerId)
                : getMicrosoftAuthUrl(ownerId);

        window.location.href = url;
    };

    const handleTest = async () => {
        setActionLoading(true);

        try {
            await testEmailConnection();

            alert('Connection is working perfectly!');
            fetchStatus();
        } catch (err) {
            alert(
                err?.response?.data?.error ||
                    'Connection test failed.'
            );

            fetchStatus();
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to disconnect this account?'
        );

        if (!confirmed) return;

        setActionLoading(true);

        try {
            await disconnectEmail();
            setConnection(null);
        } catch (err) {
            alert('Failed to disconnect.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <aside
            className={`
                ${
                    isMobile
                        ? 'w-full'
                        : 'w-[300px]'
                }

                h-full
                flex
                flex-col
                shrink-0

                transition-all
                duration-300

                bg-white
                dark:bg-slate-950

                border-r
                border-slate-200
                dark:border-slate-800

                text-slate-900
                dark:text-white
            `}
        >
            {/* Header */}
            <div
                className="
                    px-5
                    py-3
                    border-b
                    border-slate-200
                    dark:border-slate-800
                "
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p
                            className="
                                text-[11px]
                                uppercase
                                tracking-[0.28em]
                                font-black

                                text-slate-400
                                dark:text-slate-500
                            "
                        >
                            Email Hub
                        </p>

                        <h2
                            className="
                                text-2xl
                                font-bold
                                mt-1

                                text-slate-900
                                dark:text-white
                            "
                        >
                            Workspace
                        </h2>
                    </div>

                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="
                                w-10
                                h-10
                                rounded-xl

                                flex
                                items-center
                                justify-center

                                bg-slate-100
                                dark:bg-slate-900

                                hover:bg-slate-200
                                dark:hover:bg-slate-800

                                transition-all
                            "
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                close
                            </span>
                        </button>
                    )}
                </div>

                {/* Compose Button */}
                <button
                    onClick={onCompose}
                    disabled={
                        !connection ||
                        connection.status !== 'connected'
                    }
                    className={`
                        w-full
                        rounded-2xl
                        px-5
                        py-4

                        flex
                        items-center
                        justify-center
                        gap-3

                        text-sm
                        font-semibold

                        transition-all
                        duration-300

                        ${
                            connection?.status === 'connected'
                                ? `
                                    bg-gradient-to-r
                                    from-cyan-500
                                    to-emerald-500

                                    text-white

                                    hover:scale-[1.02]
                                    hover:shadow-xl
                                    hover:shadow-cyan-500/20
                                `
                                : `
                                    bg-slate-200
                                    dark:bg-slate-800

                                    text-slate-400
                                    dark:text-slate-500

                                    cursor-not-allowed
                                `
                        }
                    `}
                >
                    <span className="material-symbols-outlined text-[22px]">
                        edit
                    </span>

                    <span>Compose Email</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                <div className="space-y-2">
                    {folders.map((folder) => {
                        const active =
                            activeFolder === folder.id;

                        return (
                            <button
                                key={folder.id}
                                onClick={() =>
                                    onFolderChange(folder.id)
                                }
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    justify-between

                                    px-4
                                    py-3.5

                                    rounded-2xl

                                    transition-all
                                    duration-300

                                    border

                                    ${
                                        active
                                            ? `
                                                bg-cyan-50
                                                dark:bg-cyan-500/10

                                                border-cyan-200
                                                dark:border-cyan-500/20

                                                shadow-lg
                                                shadow-cyan-500/10
                                            `
                                            : `
                                                bg-transparent

                                                border-transparent

                                                hover:bg-slate-100
                                                dark:hover:bg-slate-900
                                            `
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                                            w-11
                                            h-11

                                            rounded-xl

                                            flex
                                            items-center
                                            justify-center

                                            ${
                                                active
                                                    ? `
                                                        bg-cyan-100
                                                        dark:bg-cyan-500/10
                                                    `
                                                    : `
                                                        bg-slate-100
                                                        dark:bg-slate-900
                                                    `
                                            }
                                        `}
                                    >
                                        <span
                                            className={`
                                                material-symbols-outlined
                                                text-[20px]

                                                ${
                                                    active
                                                        ? `
                                                            text-cyan-600
                                                            dark:text-cyan-400
                                                        `
                                                        : folder.color
                                                }
                                            `}
                                        >
                                            {folder.icon}
                                        </span>
                                    </div>

                                    <span
                                        className={`
                                            text-sm
                                            font-medium

                                            ${
                                                active
                                                    ? `
                                                        text-slate-900
                                                        dark:text-white
                                                    `
                                                    : `
                                                        text-slate-600
                                                        dark:text-slate-300
                                                    `
                                            }
                                        `}
                                    >
                                        {folder.name}
                                    </span>
                                </div>

                                {active && (
                                    <div
                                        className="
                                            w-2
                                            h-2
                                            rounded-full

                                            bg-cyan-500
                                            dark:bg-cyan-400
                                        "
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Connection Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <p
                            className="
                                text-xs
                                uppercase
                                tracking-[0.25em]
                                font-black

                                text-slate-400
                                dark:text-slate-500
                            "
                        >
                            Connection
                        </p>

                        {connection?.status === 'connected' && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

                                <span
                                    className="
                                        text-xs

                                        text-emerald-600
                                        dark:text-emerald-400
                                    "
                                >
                                    Active
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div
                            className="
                                h-32
                                rounded-3xl
                                animate-pulse

                                bg-slate-100
                                dark:bg-slate-900
                            "
                        />
                    ) : connection ? (
                        <div
                            className="
                                rounded-3xl
                                p-5

                                border

                                border-slate-200
                                dark:border-slate-800

                                bg-slate-50
                                dark:bg-slate-900/60
                            "
                        >
                            {/* Provider */}
                            <div className="flex items-start gap-4">
                                <div
                                    className={`
                                        w-14
                                        h-14

                                        rounded-2xl

                                        flex
                                        items-center
                                        justify-center

                                        ${
                                            connection.provider ===
                                            'google'
                                                ? `
                                                    bg-red-100
                                                    dark:bg-red-500/10
                                                `
                                                : `
                                                    bg-blue-100
                                                    dark:bg-blue-500/10
                                                `
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            material-symbols-outlined
                                            text-[28px]

                                            ${
                                                connection.provider ===
                                                'google'
                                                    ? `
                                                        text-red-500
                                                        dark:text-red-400
                                                    `
                                                    : `
                                                        text-blue-500
                                                        dark:text-blue-400
                                                    `
                                            }
                                        `}
                                    >
                                        {connection.provider ===
                                        'google'
                                            ? 'alternate_email'
                                            : 'mail'}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p
                                        className="
                                            text-xs
                                            uppercase
                                            tracking-[0.2em]
                                            font-black
                                            mb-1

                                            text-slate-400
                                            dark:text-slate-500
                                        "
                                    >
                                        {connection.provider ===
                                        'google'
                                            ? 'Google Mail'
                                            : 'Outlook'}
                                    </p>

                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                            truncate

                                            text-slate-900
                                            dark:text-white
                                        "
                                    >
                                        {connection.email}
                                    </p>

                                    <p
                                        className="
                                            text-xs
                                            mt-1

                                            text-slate-500
                                            dark:text-slate-400
                                        "
                                    >
                                        Securely connected
                                    </p>
                                </div>
                            </div>

                            {/* Error */}
                            {connection.status === 'error' && (
                                <div
                                    className="
                                        mt-4
                                        rounded-2xl
                                        p-3

                                        bg-red-50
                                        dark:bg-red-500/10

                                        border
                                        border-red-200
                                        dark:border-red-500/20
                                    "
                                >
                                    <p
                                        className="
                                            text-xs
                                            leading-relaxed

                                            text-red-600
                                            dark:text-red-300
                                        "
                                    >
                                        {connection.errorMessage ||
                                            'Authentication failed'}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-5">
                                <button
                                    onClick={handleTest}
                                    disabled={actionLoading}
                                    className="
                                        py-3
                                        rounded-2xl

                                        bg-slate-100
                                        dark:bg-slate-800

                                        border
                                        border-slate-200
                                        dark:border-slate-700

                                        hover:bg-slate-200
                                        dark:hover:bg-slate-700

                                        transition-all

                                        text-sm
                                        font-medium
                                    "
                                >
                                    {actionLoading
                                        ? 'Testing...'
                                        : 'Test'}
                                </button>

                                <button
                                    onClick={handleDisconnect}
                                    className="
                                        py-3
                                        rounded-2xl

                                        bg-red-50
                                        dark:bg-red-500/10

                                        border
                                        border-red-200
                                        dark:border-red-500/20

                                        hover:bg-red-100
                                        dark:hover:bg-red-500/20

                                        transition-all

                                        text-sm
                                        font-medium

                                        text-red-600
                                        dark:text-red-300
                                    "
                                >
                                    Remove
                                </button>
                            </div>

                            {/* Logs */}
                            {logs.length > 0 && (
                                <div
                                    className="
                                        mt-6
                                        pt-5

                                        border-t
                                        border-slate-200
                                        dark:border-slate-800
                                    "
                                >
                                    <p
                                        className="
                                            text-xs
                                            uppercase
                                            tracking-[0.2em]
                                            font-black
                                            mb-4

                                            text-slate-400
                                            dark:text-slate-500
                                        "
                                    >
                                        Recent Activity
                                    </p>

                                    <div className="space-y-3">
                                        {logs
                                            .slice(0, 3)
                                            .map((log, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3"
                                                >
                                                    <div
                                                        className={`
                                                            w-2
                                                            h-2
                                                            rounded-full
                                                            mt-1.5

                                                            ${
                                                                log.status ===
                                                                'success'
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-red-500'
                                                            }
                                                        `}
                                                    />

                                                    <p
                                                        className="
                                                            text-xs
                                                            leading-relaxed

                                                            text-slate-600
                                                            dark:text-slate-400
                                                        "
                                                    >
                                                        {log.message}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="
                                rounded-3xl
                                p-5

                                border
                                border-dashed

                                border-slate-300
                                dark:border-slate-700

                                bg-slate-50
                                dark:bg-slate-900/40
                            "
                        >
                            <div className="text-center mb-5">
                                <div
                                    className="
                                        w-16
                                        h-16

                                        rounded-3xl

                                        bg-cyan-100
                                        dark:bg-cyan-500/10

                                        flex
                                        items-center
                                        justify-center

                                        mx-auto
                                        mb-4
                                    "
                                >
                                    <span
                                        className="
                                            material-symbols-outlined
                                            text-[32px]

                                            text-cyan-600
                                            dark:text-cyan-400
                                        "
                                    >
                                        mail
                                    </span>
                                </div>

                                <h3
                                    className="
                                        text-lg
                                        font-semibold
                                        mb-2

                                        text-slate-900
                                        dark:text-white
                                    "
                                >
                                    Connect Email
                                </h3>

                                <p
                                    className="
                                        text-sm
                                        leading-relaxed

                                        text-slate-500
                                        dark:text-slate-400
                                    "
                                >
                                    Connect your mailbox to manage
                                    conversations directly from the CRM.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() =>
                                        handleConnect('google')
                                    }
                                    className="
                                        w-full

                                        flex
                                        items-center
                                        gap-4

                                        px-4
                                        py-4

                                        rounded-2xl

                                        bg-white
                                        dark:bg-slate-900

                                        border
                                        border-slate-200
                                        dark:border-slate-800

                                        hover:bg-slate-50
                                        dark:hover:bg-slate-800

                                        transition-all
                                    "
                                >
                                    <div
                                        className="
                                            w-11
                                            h-11

                                            rounded-xl

                                            bg-red-100
                                            dark:bg-red-500/10

                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        <span
                                            className="
                                                material-symbols-outlined

                                                text-red-500
                                                dark:text-red-400
                                            "
                                        >
                                            alternate_email
                                        </span>
                                    </div>

                                    <div className="text-left">
                                        <p
                                            className="
                                                text-sm
                                                font-medium

                                                text-slate-900
                                                dark:text-white
                                            "
                                        >
                                            Connect Gmail
                                        </p>

                                        <p
                                            className="
                                                text-xs

                                                text-slate-500
                                                dark:text-slate-400
                                            "
                                        >
                                            Google Workspace support
                                        </p>
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="
                                        w-full

                                        flex
                                        items-center
                                        gap-4

                                        px-4
                                        py-4

                                        rounded-2xl

                                        bg-slate-100
                                        dark:bg-slate-900

                                        border
                                        border-slate-200
                                        dark:border-slate-800

                                        opacity-60
                                        cursor-not-allowed
                                    "
                                >
                                    <div
                                        className="
                                            w-11
                                            h-11

                                            rounded-xl

                                            bg-blue-100
                                            dark:bg-blue-500/10

                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        <span
                                            className="
                                                material-symbols-outlined

                                                text-blue-500
                                                dark:text-blue-400
                                            "
                                        >
                                            mail
                                        </span>
                                    </div>

                                    <div className="text-left">
                                        <p
                                            className="
                                                text-sm
                                                font-medium

                                                text-slate-900
                                                dark:text-white
                                            "
                                        >
                                            Outlook
                                        </p>

                                        <p
                                            className="
                                                text-xs

                                                text-cyan-600
                                                dark:text-cyan-400
                                            "
                                        >
                                            Coming soon
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default EmailSidebar;