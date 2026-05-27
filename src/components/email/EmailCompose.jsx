import React, { useState, useEffect } from 'react';
import { getEmailConnectionStatus } from '../../api';

const EmailCompose = ({
    leadId,
    replyTo,
    onClose,
    onSend,
    isMobile,
}) => {
    const [to, setTo] = useState(replyTo?.from || '');
    const [subject, setSubject] = useState(
        replyTo ? `Re: ${replyTo.subject}` : ''
    );
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data } =
                    await getEmailConnectionStatus();

                setConnection(data);
            } catch (err) {
                console.error(
                    'Failed to fetch connection status:',
                    err
                );
            }
        };

        fetchStatus();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!connection) return;

        setLoading(true);

        try {
            await onSend({
                leadId,
                to,
                subject,
                body,
            });

            onClose();
        } catch (error) {
            console.error(
                'Failed to send email:',
                error
            );

            alert(
                error?.response?.data?.error ||
                    'Failed to send email.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`
                fixed
                z-[120]
                overflow-hidden
                flex
                flex-col
                transition-all
                duration-300

                ${
                    isMobile
                        ? `
                            inset-0
                            w-full
                            h-full
                            rounded-none
                        `
                        : `
                            bottom-4
                            right-4
                            w-[520px]
                            h-[720px]
                            rounded-[28px]
                        `
                }

                bg-white/95
                dark:bg-slate-950/95

                backdrop-blur-2xl

                border
                border-slate-200/70
                dark:border-white/10

                shadow-2xl
            `}
        >
            {/* HEADER */}
            <div
                className="
                    px-5
                    py-4
                    border-b
                    border-slate-200/70
                    dark:border-white/10

                    bg-white/70
                    dark:bg-slate-950/60

                    backdrop-blur-xl
                "
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`
                                w-11
                                h-11
                                rounded-2xl
                                flex
                                items-center
                                justify-center

                                ${
                                    connection
                                        ? `
                                            bg-gradient-to-br
                                            from-cyan-500/20
                                            to-emerald-500/20

                                            text-cyan-500
                                            dark:text-cyan-300
                                        `
                                        : `
                                            bg-red-500/10
                                            text-red-400
                                        `
                                }
                            `}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {!connection
                                    ? 'error'
                                    : replyTo
                                    ? 'reply'
                                    : 'edit'}
                            </span>
                        </div>

                        <div>
                            <p
                                className="
                                    text-[11px]
                                    uppercase
                                    tracking-[0.25em]
                                    font-black

                                    text-slate-500
                                    dark:text-white/40
                                "
                            >
                                {!connection
                                    ? 'Disconnected'
                                    : replyTo
                                    ? 'Reply'
                                    : 'Compose'}
                            </p>

                            <h2
                                className="
                                    text-lg
                                    font-semibold

                                    text-slate-900
                                    dark:text-white
                                "
                            >
                                {!connection
                                    ? 'Email unavailable'
                                    : replyTo
                                    ? 'Reply Email'
                                    : 'New Email'}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            w-10
                            h-10
                            rounded-2xl
                            flex
                            items-center
                            justify-center

                            text-slate-500
                            dark:text-white/60

                            hover:bg-slate-100
                            dark:hover:bg-white/10

                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined">
                            close
                        </span>
                    </button>
                </div>
            </div>

            {/* CONNECTION WARNING */}
            {!connection && (
                <div
                    className="
                        mx-5
                        mt-5
                        rounded-2xl
                        border
                        border-red-500/20

                        bg-red-500/10

                        p-4
                        flex
                        items-start
                        gap-3
                    "
                >
                    <span className="material-symbols-outlined text-red-400">
                        warning
                    </span>

                    <div>
                        <p className="text-sm font-semibold text-red-300">
                            No email account connected
                        </p>

                        <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                            Please connect your email
                            provider from the sidebar
                            before sending emails.
                        </p>
                    </div>
                </div>
            )}

            {/* FORM */}
            <form
                onSubmit={handleSend}
                className="flex flex-col flex-1 overflow-hidden"
            >
                {/* TOP META */}
                <div
                    className="
                        px-5
                        pt-5
                        space-y-4
                    "
                >
                    {/* FROM */}
                    <div
                        className="
                            rounded-2xl
                            border
                            border-slate-200/70
                            dark:border-white/10

                            bg-slate-50/80
                            dark:bg-white/[0.03]

                            px-4
                            py-3
                        "
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className="
                                    text-[11px]
                                    uppercase
                                    tracking-[0.25em]
                                    font-black
                                    shrink-0

                                    text-slate-500
                                    dark:text-white/40
                                "
                            >
                                From
                            </span>

                            <p
                                className="
                                    text-sm
                                    font-medium
                                    truncate

                                    text-slate-700
                                    dark:text-white/80
                                "
                            >
                                {connection?.email ||
                                    'Disconnected'}
                            </p>
                        </div>
                    </div>

                    {/* TO */}
                    <div
                        className="
                            rounded-2xl
                            border
                            border-slate-200/70
                            dark:border-white/10

                            bg-white
                            dark:bg-white/[0.03]

                            px-4
                            py-3
                        "
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className="
                                    text-[11px]
                                    uppercase
                                    tracking-[0.25em]
                                    font-black
                                    shrink-0

                                    text-slate-500
                                    dark:text-white/40
                                "
                            >
                                To
                            </span>

                            <input
                                type="email"
                                required
                                disabled={!connection}
                                value={to}
                                onChange={(e) =>
                                    setTo(e.target.value)
                                }
                                placeholder="Recipient email"
                                className="
                                    w-full
                                    bg-transparent
                                    outline-none
                                    border-none

                                    text-sm
                                    font-medium

                                    text-slate-900
                                    dark:text-white

                                    placeholder:text-slate-400
                                    dark:placeholder:text-white/20
                                "
                            />
                        </div>
                    </div>

                    {/* SUBJECT */}
                    <div
                        className="
                            rounded-2xl
                            border
                            border-slate-200/70
                            dark:border-white/10

                            bg-white
                            dark:bg-white/[0.03]

                            px-4
                            py-3
                        "
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className="
                                    text-[11px]
                                    uppercase
                                    tracking-[0.25em]
                                    font-black
                                    shrink-0

                                    text-slate-500
                                    dark:text-white/40
                                "
                            >
                                Sub
                            </span>

                            <input
                                type="text"
                                required
                                disabled={!connection}
                                value={subject}
                                onChange={(e) =>
                                    setSubject(
                                        e.target.value
                                    )
                                }
                                placeholder="Email subject"
                                className="
                                    w-full
                                    bg-transparent
                                    outline-none
                                    border-none

                                    text-sm
                                    font-medium

                                    text-slate-900
                                    dark:text-white

                                    placeholder:text-slate-400
                                    dark:placeholder:text-white/20
                                "
                            />
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 px-5 py-5 overflow-hidden">
                    <div
                        className="
                            h-full
                            rounded-[24px]

                            border
                            border-slate-200/70
                            dark:border-white/10

                            bg-slate-50/70
                            dark:bg-white/[0.03]

                            overflow-hidden
                        "
                    >
                        <textarea
                            required
                            disabled={!connection}
                            value={body}
                            onChange={(e) =>
                                setBody(e.target.value)
                            }
                            placeholder="Write your message here..."
                            className="
                                w-full
                                h-full
                                resize-none
                                border-none
                                outline-none
                                bg-transparent

                                px-5
                                py-5

                                text-[15px]
                                leading-8

                                text-slate-800
                                dark:text-white/90

                                placeholder:text-slate-400
                                dark:placeholder:text-white/20
                            "
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    className="
                        px-5
                        py-4

                        border-t
                        border-slate-200/70
                        dark:border-white/10

                        bg-white/70
                        dark:bg-slate-950/60

                        backdrop-blur-xl
                    "
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40">
                            <span className="material-symbols-outlined text-[16px]">
                                lock
                            </span>

                            Secure compose
                        </div>

                        <button
                            type="submit"
                            disabled={
                                loading || !connection
                            }
                            className="
                                px-6
                                py-3
                                rounded-2xl

                                flex
                                items-center
                                gap-3

                                font-semibold
                                text-sm

                                text-white

                                bg-gradient-to-r
                                from-cyan-500
                                to-emerald-500

                                hover:scale-[1.02]
                                hover:shadow-2xl
                                hover:shadow-cyan-500/20

                                active:scale-[0.99]

                                transition-all

                                disabled:opacity-50
                                disabled:hover:scale-100
                            "
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">
                                        progress_activity
                                    </span>

                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">
                                        send
                                    </span>

                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EmailCompose;

