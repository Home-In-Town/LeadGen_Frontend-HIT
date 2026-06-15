import React, { useState, useEffect } from 'react';

const FacebookIntegrationPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check URL params on mount — backend redirects here with ?connected=true on success
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('connected') === 'true') {
            setIsConnected(true);
            // Clean up the URL without a page reload
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleConnect = () => {
        // Redirect to backend's /connect endpoint which sets the state cookie
        // and then redirects to Facebook — this avoids the auth cookie problem on callback.
        const backendUrl = import.meta.env.VITE_API_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';
        window.location.href = `${backendUrl}/api/facebook/connect`;
    };

    const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

    return (
        <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className={`${cardClass} mb-8 p-6 md:p-8`}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                                    Meta Lead Ads
                                </span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                                Facebook Integration
                            </h1>

                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Connect Facebook pages & receive lead ads instantly
                            </p>
                        </div>

                        <div
                            className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 font-black uppercase tracking-[0.25em]
                            ${
                                isConnected
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            }`}
                        >
                            <span
                                className={`h-3 w-3 rounded-full ${
                                    isConnected
                                        ? 'bg-emerald-500 animate-pulse'
                                        : 'bg-red-500'
                                }`}
                            />

                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* Left Column */}
                    <div className="lg:col-span-1">
                        <div className={`${cardClass} p-6 md:p-8`}>

                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                                    <span className="text-2xl font-black">f</span>
                                </div>

                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                        Facebook OAuth
                                    </h2>

                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                        Secure Meta authentication
                                    </p>
                                </div>
                            </div>

                            {!isConnected ? (
                                <div>
                                    <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                            Connect your Facebook account to sync Lead Ads
                                            forms directly into your CRM pipeline.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleConnect}
                                        disabled={loading}
                                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="text-xl font-black">f</span>

                                        {loading
                                            ? 'Connecting...'
                                            : 'Connect Facebook'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-white transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Refresh Pages
                                    </button>

                                    <button
                                        className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-red-600 transition-all hover:bg-red-500/20 dark:text-red-400"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2">
                        <div className={`${cardClass} p-6 md:p-8`}>

                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        Lead Form Mapping
                                    </h2>

                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                        Map Meta forms to projects
                                    </p>
                                </div>
                            </div>

                            {!isConnected ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 p-12 text-center">

                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                                        <span className="material-symbols-outlined text-4xl text-slate-500 dark:text-slate-400">
                                            lock
                                        </span>
                                    </div>

                                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">
                                        Facebook Not Connected
                                    </h3>

                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Connect your Facebook account first to access
                                        lead forms and configure automatic lead routing.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 p-12 text-center">

                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                                        <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">
                                            description
                                        </span>
                                    </div>

                                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">
                                        No Lead Forms Found
                                    </h3>

                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Create Facebook Lead Ads forms in Meta Ads Manager
                                        to begin syncing leads automatically.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FacebookIntegrationPage;

