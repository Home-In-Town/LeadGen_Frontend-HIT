import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'default',
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleEscape);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const variants = {
        default: {
            icon: 'help',
            iconBg: `
                bg-slate-100
                dark:bg-white/10
            `,
            iconColor: `
                text-slate-700
                dark:text-white
            `,
            button: `
                bg-slate-900
                hover:bg-slate-800
                dark:bg-white
                dark:text-slate-900
                dark:hover:bg-white/90
            `,
        },

        danger: {
            icon: 'warning',
            iconBg: `
                bg-red-100
                dark:bg-red-500/15
            `,
            iconColor: `
                text-red-600
                dark:text-red-400
            `,
            button: `
                bg-red-500
                hover:bg-red-600
                text-white
            `,
        },

        success: {
            icon: 'check_circle',
            iconBg: `
                bg-emerald-100
                dark:bg-emerald-500/15
            `,
            iconColor: `
                text-emerald-600
                dark:text-emerald-400
            `,
            button: `
                bg-emerald-500
                hover:bg-emerald-600
                text-white
            `,
        },
    };

    const current = variants[type] || variants.default;

    return createPortal(
        <div
            className="
                fixed
                inset-0
                z-[120]
                flex
                items-center
                justify-center
                p-4
                sm:p-6

                bg-slate-900/50
                dark:bg-black/70

                backdrop-blur-md
                animate-fade-in
            "
        >
            {/* Overlay */}
            <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute inset-0 cursor-default"
            />

            {/* Modal */}
            <div
                className="
                    relative
                    w-full
                    max-w-md

                    overflow-hidden

                    rounded-[28px]

                    border
                    border-slate-200/70
                    dark:border-white/10

                    bg-white/95
                    dark:bg-slate-950/95

                    backdrop-blur-2xl

                    shadow-[0_20px_80px_rgba(0,0,0,0.18)]
                    dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]

                    animate-slide-up
                "
            >
                {/* Top Glow */}
                <div
                    className={`
                        absolute
                        top-0
                        left-0
                        right-0
                        h-[2px]

                        ${
                            type === 'danger'
                                ? 'bg-red-500'
                                : type === 'success'
                                ? 'bg-emerald-500'
                                : 'bg-slate-900 dark:bg-white'
                        }
                    `}
                />

                {/* Header */}
                <div className="flex items-start justify-between p-6 sm:p-7 pb-4">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                            className={`
                                w-14
                                h-14
                                rounded-2xl

                                flex
                                items-center
                                justify-center

                                shrink-0

                                ${current.iconBg}
                            `}
                        >
                            <span
                                className={`
                                    material-symbols-outlined
                                    text-[28px]

                                    ${current.iconColor}
                                `}
                            >
                                {current.icon}
                            </span>
                        </div>

                        {/* Text */}
                        <div>
                            <p
                                className="
                                    text-[10px]
                                    uppercase
                                    tracking-[0.3em]
                                    font-black

                                    text-slate-400
                                    dark:text-white/40

                                    mb-2
                                "
                            >
                                Confirmation
                            </p>

                            <h2
                                className="
                                    text-xl
                                    sm:text-2xl
                                    font-black
                                    tracking-tight
                                    leading-tight

                                    text-slate-900
                                    dark:text-white
                                "
                            >
                                {title}
                            </h2>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="
                            w-10
                            h-10
                            rounded-xl

                            flex
                            items-center
                            justify-center

                            transition-all
                            duration-200

                            text-slate-500
                            dark:text-white/50

                            hover:bg-slate-100
                            dark:hover:bg-white/10

                            hover:text-slate-900
                            dark:hover:text-white
                        "
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            close
                        </span>
                    </button>
                </div>

                {/* Message */}
                <div className="px-6 sm:px-7 pb-7">
                    {/* <div
                        className="
                            rounded-2xl

                            border
                            border-slate-200/70
                            dark:border-white/10

                            bg-slate-50/80
                            dark:bg-white/[0.03]

                            p-4
                            sm:p-5
                        "
                    > */}
                        <p
                            className="
                                text-sm
                                leading-relaxed

                                text-slate-600
                                dark:text-white/65
                            "
                        >
                            {message}
                        </p>
                    {/* </div> */}
                </div>

                {/* Footer */}
                <div
                    className="
                        px-6
                        sm:px-7
                        pb-6
                        sm:pb-7

                        flex
                        flex-col-reverse
                        sm:flex-row

                        gap-3
                    "
                >
                    {/* Cancel */}
                    <button
                        onClick={onClose}
                        className="
                            flex-1

                            h-12

                            rounded-2xl

                            border
                            border-slate-200
                            dark:border-white/10

                            bg-white
                            dark:bg-white/[0.03]

                            text-sm
                            font-semibold

                            text-slate-700
                            dark:text-white

                            transition-all
                            duration-200

                            hover:bg-slate-100
                            dark:hover:bg-white/[0.06]
                        "
                    >
                        {cancelText}
                    </button>

                    {/* Confirm */}
                    <button
                        onClick={() => {
                            onConfirm?.();
                            onClose?.();
                        }}
                        className={`
                            flex-1

                            h-12

                            rounded-2xl

                            text-sm
                            font-semibold

                            transition-all
                            duration-200

                            hover:scale-[1.01]
                            active:scale-[0.99]

                            shadow-lg

                            ${current.button}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;