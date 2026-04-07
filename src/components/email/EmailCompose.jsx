import React, { useState, useEffect } from 'react';
import { getEmailConnectionStatus } from '../../api';

const EmailCompose = ({ leadId, replyTo, onClose, onSend, isMobile }) => {
    const [to, setTo] = useState(replyTo?.from || '');
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data } = await getEmailConnectionStatus();
                setConnection(data);
            } catch (err) {
                console.error("Failed to fetch connection status in Compose:", err);
            }
        };
        fetchStatus();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!connection) return;

        setLoading(true);
        try {
            await onSend({ leadId, to, subject, body });
            onClose();
        } catch (error) {
            console.error('Failed to send email:', error);
            alert(error.response?.data?.error || "Failed to send email. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`
            ${isMobile ? 'inset-0 w-full rounded-none' : 'bottom-0 right-10 w-[450px] lg:w-[500px] rounded-t-2xl border border-charcoal/10'}
            bg-white shadow-2xl z-50 overflow-hidden flex flex-col transform transition-transform duration-500 ease-spring fixed
        `}>
            {/* Header */}
            <div className={`p-3 sm:p-4 flex items-center justify-between text-white transition-colors duration-500 ${!connection ? 'bg-red-500' : 'bg-charcoal'}`}>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">
                        {!connection ? 'error' : (replyTo ? 'reply' : 'edit')}
                    </span>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] m-0">
                        {!connection ? 'No Account' : (replyTo ? 'Reply' : 'New')}
                    </h3>
                </div>
                <button 
                    onClick={onClose}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            <form onSubmit={handleSend} className="flex flex-col grow h-[500px]">
                {/* Connection Alert */}
                {!connection && (
                    <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[18px]">info</span>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                            Please connect your email in settings first.
                        </p>
                    </div>
                )}

                {/* Sender Info */}
                <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-charcoal/5 bg-charcoal/[0.01]">
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-charcoal/20 w-8">From</span>
                        <span className="text-[10px] font-black text-charcoal/60 lowercase italic truncate translate-y-[1px]">
                            {connection ? connection.email : 'disconnected'}
                        </span>
                    </div>
                </div>

                {/* Recipients */}
                <div className="px-4 sm:px-6 py-2 border-b border-charcoal/5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-charcoal/20 w-8">To</span>
                        <input
                            type="email"
                            required
                            disabled={!connection}
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="grow bg-transparent border-none text-[11px] font-bold text-charcoal focus:ring-0 outline-none placeholder:text-charcoal/10"
                            placeholder="Recipient email..."
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-charcoal/20 w-8">Sub</span>
                        <input
                            type="text"
                            required
                            disabled={!connection}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="grow bg-transparent border-none text-[11px] font-bold text-charcoal focus:ring-0 outline-none placeholder:text-charcoal/10"
                            placeholder="Email subject..."
                        />
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-grow flex flex-col p-4 sm:p-6 bg-[#fdfdfd]">
                    <textarea
                        required
                        disabled={!connection}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full flex-grow bg-transparent border-none resize-none text-[13px] leading-relaxed font-semibold text-charcoal focus:ring-0 outline-none placeholder:text-charcoal/10 space-y-4"
                        placeholder="Hello, I wanted to follow up on your interest in..."
                    />
                </div>

                {/* Actions Toolbar */}
                <div className="p-4 sm:p-6 border-t border-charcoal/5 flex items-center justify-between bg-white sticky bottom-0">
                    <div className="flex items-center gap-4">
                        {/* More icons/actions can go here */}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !connection}
                        className="bg-charcoal text-white rounded-lg py-2 px-6 flex items-center gap-3 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] transition-all disabled:opacity-50 group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {loading ? 'Sending...' : 'Send'}
                        </span>
                        {!loading && connection && (
                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">send</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailCompose;
