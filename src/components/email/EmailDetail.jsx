
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const EmailDetail = ({
    email,
    onClose,
    onDelete,
    onReply,
    onArchive,
    onSpam,
    isMobile,
}) => {
    const renderBody = useMemo(() => {
        if (!email?.body) return null;

        return {
            __html: email.body,
        };
    }, [email?.body]);

    if (!email) {
        return (
            <div
                className="
                    flex-1
                    h-full

                    flex
                    flex-col
                    items-center
                    justify-center

                    text-center
                    px-8

                    bg-slate-50
                    dark:bg-slate-950/40
                "
            >
                <div
                    className="
                        w-28
                        h-28
                        rounded-[2rem]

                        bg-cyan-500/10

                        flex
                        items-center
                        justify-center

                        mb-8
                    "
                >
                    <span className="material-symbols-outlined text-[48px] text-cyan-400">
                        mail
                    </span>
                </div>

                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-3">
                    Select an Email
                </h2>

                <p className="text-sm leading-relaxed text-slate-500 dark:text-white/40 max-w-sm">
                    Choose a conversation from the list
                    to read messages, reply, and manage
                    communication.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`
                flex-1
                h-full
                flex
                flex-col
                overflow-hidden

                bg-white/80
                dark:bg-slate-950/70

                backdrop-blur-2xl

                text-slate-900
                dark:text-white

                ${
                    isMobile
                        ? 'fixed inset-0 z-[100]'
                        : ''
                }
            `}
        >
            {/* Top Toolbar */}
            <div
                className="
                    sticky
                    top-0
                    z-20

                    flex
                    items-center
                    justify-between

                    px-4
                    md:px-6
                    py-4

                    border-b
                    border-slate-200/60
                    dark:border-white/10

                    bg-white/80
                    dark:bg-slate-950/75

                    backdrop-blur-2xl
                "
            >
                {/* Left */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="
                            w-11
                            h-11
                            rounded-2xl

                            flex
                            items-center
                            justify-center

                            bg-slate-100
                            dark:bg-white/[0.04]

                            hover:bg-slate-200
                            dark:hover:bg-white/[0.08]

                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            arrow_back
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            if (!email?._id) return;

                            onArchive?.(email._id);
                        }}
                        className="
                            w-11
                            h-11
                            rounded-2xl

                            flex
                            items-center
                            justify-center

                            bg-slate-100
                            dark:bg-white/[0.04]

                            hover:bg-slate-200
                            dark:hover:bg-white/[0.08]

                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            archive
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            if (!email?._id) return;

                            onSpam?.(email._id);
                        }}
                        className="
                            w-11
                            h-11
                            rounded-2xl

                            flex
                            items-center
                            justify-center

                            bg-slate-100
                            dark:bg-white/[0.04]

                            hover:bg-slate-200
                            dark:hover:bg-white/[0.08]

                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            report
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            if (!email?._id) return;

                            onDelete?.(email._id);
                        }}
                        className="
                            w-11
                            h-11
                            rounded-2xl

                            flex
                            items-center
                            justify-center

                            bg-red-500/10

                            hover:bg-red-500/20

                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined text-[20px] text-red-400">
                            delete
                        </span>
                    </button>
                </div>

                {/* Right */}
                <button
                    onClick={() => onReply(email)}
                    className="
                        h-11
                        px-5

                        rounded-2xl

                        flex
                        items-center
                        gap-2

                        bg-gradient-to-r
                        from-cyan-500
                        to-emerald-500

                        text-white

                        hover:scale-[1.02]
                        hover:shadow-xl
                        hover:shadow-cyan-500/20

                        transition-all
                    "
                >
                    <span className="material-symbols-outlined text-[20px]">
                        reply
                    </span>

                    <span className="text-sm font-medium hidden sm:inline">
                        Reply
                    </span>
                </button>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-5 md:px-10 py-8">
                    {/* Email Card */}
                    <div
                        className="
                            rounded-[2rem]

                            border
                            border-slate-200/60
                            dark:border-white/10

                            bg-white/70
                            dark:bg-white/[0.03]

                            backdrop-blur-xl

                            p-6
                            md:p-8

                            shadow-xl
                            shadow-black/5
                        "
                    >
                        {/* Tag */}
                        <div className="mb-5">
                            <span
                                className="
                                    inline-flex
                                    items-center
                                    gap-2

                                    px-4
                                    py-2

                                    rounded-full

                                    bg-cyan-500/10

                                    text-cyan-500

                                    text-xs
                                    uppercase
                                    tracking-[0.2em]
                                    font-bold
                                "
                            >
                                <div className="w-2 h-2 rounded-full bg-cyan-400" />

                                {email.folder || 'Inbox'}
                            </span>
                        </div>

                        {/* Subject */}
                        <h1
                            className="
                                text-2xl
                                md:text-4xl

                                font-bold

                                leading-tight

                                text-slate-900
                                dark:text-white

                                mb-8
                            "
                        >
                            {email.subject}
                        </h1>

                        {/* Sender */}
                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                md:justify-between

                                gap-5

                                p-5

                                rounded-3xl

                                bg-slate-100/70
                                dark:bg-white/[0.03]

                                border
                                border-slate-200
                                dark:border-white/5

                                mb-8
                            "
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar */}
                                <div
                                    className="
                                        w-14
                                        h-14

                                        rounded-2xl

                                        flex
                                        items-center
                                        justify-center

                                        bg-gradient-to-br
                                        from-cyan-500
                                        to-emerald-500

                                        text-white
                                        text-lg
                                        font-bold

                                        shrink-0
                                    "
                                >
                                    {email.to
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold truncate">
                                        {email.leadId
                                            ? `${email.leadId.first_name} ${
                                                  email.leadId
                                                      .last_name ||
                                                  ''
                                              }`
                                            : email.to}
                                    </h3>

                                    <p className="text-sm text-slate-500 dark:text-white/40 truncate mt-1">
                                        {email.to}
                                    </p>

                                    <p className="text-xs text-slate-400 dark:text-white/30 mt-2">
                                        {new Date(
                                            email.createdAt
                                        ).toLocaleString([], {
                                            dateStyle:
                                                'medium',
                                            timeStyle:
                                                'short',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Lead Link */}
                            {email.leadId && (
                                <Link
                                    to={`/lead/${
                                        email.leadId._id ||
                                        email.leadId.id
                                    }`}
                                    className="
                                        h-12
                                        px-5

                                        rounded-2xl

                                        flex
                                        items-center
                                        justify-center
                                        gap-2

                                        bg-cyan-500/10
                                        text-cyan-500

                                        hover:bg-cyan-500
                                        hover:text-white

                                        transition-all

                                        text-sm
                                        font-medium
                                    "
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        person
                                    </span>

                                    View Lead
                                </Link>
                            )}
                        </div>

                        {/* Email Body */}
                        <div
                            className="
                                email-content-view

                                text-[15px]
                                md:text-[16px]

                                leading-[1.9]

                                text-slate-700
                                dark:text-white/75
                            "
                            dangerouslySetInnerHTML={
                                renderBody
                            }
                        />

                        {/* Bottom Actions */}
                        <div
                            className="
                                flex
                                flex-wrap
                                gap-3

                                mt-10
                                pt-8

                                border-t
                                border-slate-200/60
                                dark:border-white/10
                            "
                        >
                            <button
                                onClick={() =>
                                    onReply(email)
                                }
                                className="
                                    h-12
                                    px-5

                                    rounded-2xl

                                    flex
                                    items-center
                                    gap-2

                                    bg-slate-100
                                    dark:bg-white/[0.05]

                                    hover:bg-slate-200
                                    dark:hover:bg-white/[0.08]

                                    transition-all
                                "
                            >
                                <span className="material-symbols-outlined">
                                    reply
                                </span>

                                <span className="text-sm font-medium">
                                    Reply
                                </span>
                            </button>

                            <button
                                className="
                                    h-12
                                    px-5

                                    rounded-2xl

                                    flex
                                    items-center
                                    gap-2

                                    bg-slate-100
                                    dark:bg-white/[0.05]

                                    hover:bg-slate-200
                                    dark:hover:bg-white/[0.08]

                                    transition-all
                                "
                            >
                                <span className="material-symbols-outlined">
                                    forward
                                </span>

                                <span className="text-sm font-medium">
                                    Forward
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body Styles */}
            <style>{`
                .email-content-view p {
                    margin-bottom: 1.6em;
                }

                .email-content-view h1,
                .email-content-view h2,
                .email-content-view h3,
                .email-content-view h4 {
                    margin-top: 2em;
                    margin-bottom: 1em;
                    font-weight: 700;
                    color: inherit;
                    line-height: 1.3;
                }

                .email-content-view a {
                    color: #06b6d4;
                    text-decoration: underline;
                }

                .email-content-view ul,
                .email-content-view ol {
                    margin-bottom: 1.5em;
                    padding-left: 1.5em;
                }

                .email-content-view li {
                    margin-bottom: 0.5em;
                }

                .email-content-view blockquote {
                    border-left: 3px solid rgba(6, 182, 212, 0.5);
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    opacity: 0.8;
                }

                .email-content-view img {
                    max-width: 100%;
                    border-radius: 1rem;
                    margin: 1rem 0;
                }

                .email-content-view pre {
                    overflow-x: auto;
                    padding: 1rem;
                    border-radius: 1rem;
                    background: rgba(0,0,0,0.05);
                }

                .dark .email-content-view pre {
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
};

export default EmailDetail;

