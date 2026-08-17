
import React from 'react';

const EmailList = ({
    folder,
    emails,
    activeId,
    onEmailSelect,
    loading,
    onRefresh,
    search,
    onSearch,
    onMenuClick,
    isMobile,
}) => {
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <section
            className={`
                ${
                    isMobile
                        ? 'w-full'
                        : 'w-[340px] xl:w-[380px]'
                }

                h-full
                flex
                flex-col
                shrink-0
                overflow-hidden

                bg-white/80
                dark:bg-slate-950/70

                backdrop-blur-2xl

                border-r
                border-slate-200/60
                dark:border-white/10

                text-slate-900
                dark:text-white

                transition-all
                duration-300
            `}
        >
            {/* Header */}
            <div
                className="
                    px-5
                    py-4
                    border-b
                    border-slate-200/60
                    dark:border-white/10
                    backdrop-blur-xl
                "
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button
                                onClick={onMenuClick}
                                className="
                                    w-10
                                    h-10
                                    rounded-2xl
                                    flex
                                    items-center
                                    justify-center

                                    bg-slate-100
                                    dark:bg-white/[0.05]

                                    hover:bg-slate-200
                                    dark:hover:bg-white/[0.08]

                                    transition-all
                                "
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    menu
                                </span>
                            </button>
                        )}

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
                                Mailbox
                            </p>

                            <h2 className="text-xl font-semibold capitalize mt-1">
                                {folder}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onRefresh}
                        className="
                            w-11
                            h-11
                            rounded-2xl
                            flex
                            items-center
                            justify-center

                            bg-slate-100
                            dark:bg-white/[0.05]

                            hover:bg-slate-200
                            dark:hover:bg-white/[0.08]

                            transition-all
                        "
                    >
                        <span
                            className={`
                                material-symbols-outlined
                                text-[20px]
                                ${
                                    loading
                                        ? 'animate-spin'
                                        : ''
                                }
                            `}
                        >
                            refresh
                        </span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <span
                        className="
                            material-symbols-outlined
                            absolute
                            left-4
                            top-1/2
                            -translate-y-1/2
                            text-[20px]

                            text-slate-400
                            dark:text-white/30

                            group-focus-within:text-cyan-500
                            transition-colors
                        "
                    >
                        search
                    </span>

                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={search}
                        onChange={(e) =>
                            onSearch(e.target.value)
                        }
                        className="
                            w-full
                            h-14
                            rounded-2xl

                            pl-12
                            pr-4

                            text-sm

                            bg-slate-100
                            dark:bg-white/[0.04]

                            border
                            border-slate-200
                            dark:border-white/10

                            text-slate-900
                            dark:text-white

                            placeholder:text-slate-400
                            dark:placeholder:text-white/30

                            focus:outline-none
                            focus:ring-2
                            focus:ring-cyan-500/40
                            focus:border-cyan-500/40

                            transition-all
                        "
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-10 space-y-4">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="
                                    h-24
                                    rounded-3xl
                                    bg-slate-100
                                    dark:bg-white/[0.04]
                                    animate-pulse
                                "
                            />
                        ))}
                    </div>
                ) : emails.length === 0 ? (
                    <div
                        className="
                            h-full
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                            px-8
                        "
                    >
                        <div
                            className="
                                w-24
                                h-24
                                rounded-3xl

                                bg-cyan-500/10

                                flex
                                items-center
                                justify-center

                                mb-6
                            "
                        >
                            <span className="material-symbols-outlined text-[42px] text-cyan-400">
                                mail_lock
                            </span>
                        </div>

                        <h3 className="text-xl font-semibold mb-2">
                            No Emails Found
                        </h3>

                        <p className="text-sm text-slate-500 dark:text-white/40 max-w-[240px] leading-relaxed">
                            Your mailbox is empty or no
                            messages match the current
                            search.
                        </p>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {emails.map((email) => {
                            const leadName = email.leadId
                                ? `${email.leadId.first_name} ${
                                      email.leadId.last_name ||
                                      ''
                                  }`
                                : email.to;

                            const isSelected =
                                activeId === email._id;

                            const isUnread =
                                email.status === 'inbox' &&
                                !email.isRead;

                            return (
                                <button
                                    key={email._id}
                                    onClick={() =>
                                        onEmailSelect(email._id)
                                    }
                                    className={`
                                        w-full
                                        text-left
                                        relative
                                        overflow-hidden

                                        rounded-3xl
                                        p-4

                                        border

                                        transition-all
                                        duration-300

                                        ${
                                            isSelected
                                                ? `
                                                    bg-cyan-500/10
                                                    border-cyan-500/20
                                                    shadow-xl
                                                    shadow-cyan-500/10
                                                `
                                                : `
                                                    bg-slate-50
                                                    dark:bg-white/[0.03]

                                                    border-slate-200
                                                    dark:border-white/5

                                                    hover:bg-slate-100
                                                    dark:hover:bg-white/[0.06]

                                                    hover:border-cyan-500/10
                                                `
                                        }
                                    `}
                                >
                                    {/* unread indicator */}
                                    {isUnread && (
                                        <div
                                            className="
                                                absolute
                                                left-0
                                                top-0
                                                h-full
                                                w-1.5
                                                bg-cyan-400
                                                shadow-lg
                                                shadow-cyan-400/50
                                            "
                                        />
                                    )}

                                    {/* top row */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="min-w-0">
                                            <h3
                                                className={`
                                                    text-sm
                                                    truncate

                                                    ${
                                                        isUnread
                                                            ? 'font-semibold'
                                                            : 'font-medium opacity-80'
                                                    }
                                                `}
                                            >
                                                {leadName}
                                            </h3>

                                            <p
                                                className="
                                                    text-xs
                                                    uppercase
                                                    tracking-[0.15em]
                                                    mt-1

                                                    text-slate-500
                                                    dark:text-white/30
                                                "
                                            >
                                                {email.subject}
                                            </p>
                                        </div>

                                        <span
                                            className="
                                                text-xs
                                                shrink-0

                                                text-slate-400
                                                dark:text-white/30
                                            "
                                        >
                                            {formatTime(
                                                email.createdAt
                                            )}
                                        </span>
                                    </div>

                                    {/* snippet */}
                                    <p
                                        className="
                                            text-sm
                                            leading-relaxed
                                            line-clamp-2

                                            text-slate-600
                                            dark:text-white/50
                                        "
                                    >
                                        {email.snippet ||
                                            'No preview available...'}
                                    </p>

                                    {/* selected glow */}
                                    {isSelected && (
                                        <div
                                            className="
                                                absolute
                                                inset-0
                                                rounded-3xl
                                                ring-1
                                                ring-cyan-400/30
                                                pointer-events-none
                                            "
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default EmailList;

