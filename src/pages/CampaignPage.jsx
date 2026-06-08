/**
 * CampaignPage.jsx
 *
 * Bulk Lead Campaign management page.
 * Features:
 *  - Upload CSV/Excel file to start a campaign
 *  - Real-time progress via Socket.IO (campaign_created, campaign_progress)
 *  - Campaign list with per-channel progress bars
 *  - Campaign detail panel with dead-letter list and retry
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
    uploadCampaign as apiUpload,
    listCampaigns as apiListCampaigns,
    getCampaignProgress,
    getCampaignDeadLetters,
    retryCampaign as apiRetryCampaign,
    pauseCampaign as apiPauseCampaign,
    resumeCampaign as apiResumeCampaign,
    deleteCampaign as apiDeleteCampaign,
} from '../api';

// ── Utility helpers ──────────────────────────────────────────────────────────

function formatNumber(n) {
    if (n == null) return '0';
    return n.toLocaleString('en-IN');
}

function pct(completed, total) {
    if (!total) return 0;
    return Math.round((completed / total) * 100);
}

function StatusBadge({ status }) {
    const map = {
        active:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        paused:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[status] || map.active}`}>
            {status}
        </span>
    );
}

function ProgressBar({ value, color = 'bg-emerald-500' }) {
    return (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

// ── Upload Panel ─────────────────────────────────────────────────────────────

function UploadPanel({ onSuccess }) {
    const [file, setFile]       = useState(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult]   = useState(null);
    const [error, setError]     = useState(null);
    const inputRef              = useRef(null);

    const MAX_SIZE_MB = 20;

    const validateFile = (f) => {
        if (!f) return null;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            return 'Invalid file type. Only .xlsx, .xls, and .csv are allowed.';
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
            return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
        }
        return null;
    };

    const handleFile = (f) => {
        const err = validateFile(f);
        if (err) { setError(err); setFile(null); return; }
        setError(null);
        setResult(null);
        setFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await apiUpload(file);
            setResult(res.data);
            setFile(null);
            if (onSuccess) onSuccess(res.data);
        } catch (err) {
            const status = err.response?.status;
            if (status === 413) setError('File too large. Maximum size is 20 MB.');
            else if (status === 400) setError(err.response?.data?.error || 'Invalid file or parse error.');
            else setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-white/10 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">upload_file</span>
                Upload Leads
            </h2>

            {/* Drop zone */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragging
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2 block">
                    cloud_upload
                </span>
                {file ? (
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Drag &amp; drop or click to browse
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            .xlsx, .xls, .csv &nbsp;·&nbsp; max {MAX_SIZE_MB} MB &nbsp;·&nbsp; up to 10,000 leads
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-3 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                    <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
                    {error}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-4 py-3 transition-colors"
            >
                {loading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> Uploading…</>
                    : <><span className="material-symbols-outlined text-base">rocket_launch</span> Start Campaign</>
                }
            </button>

            {/* Success result */}
            {result && (
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Campaign created!
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(result.totalCreated)}</span> leads imported</div>
                        <div><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(result.duplicatesSkipped)}</span> duplicates skipped</div>
                        {result.parseErrors > 0 && (
                            <div className="col-span-2 text-amber-600 dark:text-amber-400">
                                {result.parseErrors} rows had parse errors
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onSelect, isSelected }) {
    const vTotal  = campaign.voiceTotal  || 0;
    const vDone   = (campaign.voiceCompleted || 0) + (campaign.voiceDeadLetter || 0) + (campaign.voiceSkipped || 0);
    const waTotal = campaign.waTotal     || 0;
    const waDone  = (campaign.waCompleted || 0) + (campaign.waDeadLetter || 0);
    const eTotal  = campaign.emailTotal  || 0;
    const eDone   = (campaign.emailCompleted || 0) + (campaign.emailDeadLetter || 0) + (campaign.emailSkipped || 0);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(campaign)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(campaign)}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10'
                    : 'border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-primary/50'
            }`}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{campaign.name || 'Untitled Campaign'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatNumber(campaign.totalLeads)} leads · {new Date(campaign.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <StatusBadge status={campaign.status} />
            </div>

            <div className="space-y-2">
                {vTotal > 0 && (
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">call</span> Voice</span>
                            <span>{pct(vDone, vTotal)}% · {formatNumber(vDone)}/{formatNumber(vTotal)}</span>
                        </div>
                        <ProgressBar value={pct(vDone, vTotal)} color="bg-blue-500" />
                    </div>
                )}
                {waTotal > 0 && (
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">chat</span> WhatsApp</span>
                            <span>{pct(waDone, waTotal)}% · {formatNumber(waDone)}/{formatNumber(waTotal)}</span>
                        </div>
                        <ProgressBar value={pct(waDone, waTotal)} color="bg-emerald-500" />
                    </div>
                )}
                {eTotal > 0 && (
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span> Email</span>
                            <span>{pct(eDone, eTotal)}% · {formatNumber(eDone)}/{formatNumber(eTotal)}</span>
                        </div>
                        <ProgressBar value={pct(eDone, eTotal)} color="bg-violet-500" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Campaign Detail Panel ────────────────────────────────────────────────────

function CampaignDetail({ campaign, onClose, onRetry, onStatusChange }) {
    const [deadLetters, setDeadLetters] = useState([]);
    const [loadingDL, setLoadingDL]     = useState(false);
    const [retrying, setRetrying]       = useState(false);
    const [retryMsg, setRetryMsg]       = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const totalDeadLetters = (campaign.voiceDeadLetter || 0) + (campaign.waDeadLetter || 0) + (campaign.emailDeadLetter || 0);

    useEffect(() => {
        if (totalDeadLetters > 0) {
            setLoadingDL(true);
            getCampaignDeadLetters(campaign.campaignId)
                .then(res => setDeadLetters(res.data))
                .catch(() => setDeadLetters([]))
                .finally(() => setLoadingDL(false));
        } else {
            setDeadLetters([]);
        }
    }, [campaign.campaignId, totalDeadLetters]);

    const handleRetry = async () => {
        setRetrying(true);
        setRetryMsg(null);
        try {
            const res = await apiRetryCampaign(campaign.campaignId);
            setRetryMsg(`${res.data.requeued} jobs re-queued for retry`);
            if (onRetry) onRetry(campaign.campaignId);
        } catch {
            setRetryMsg('Retry failed. Please try again.');
        } finally {
            setRetrying(false);
        }
    };

    const handlePause = async () => {
        setActionLoading(true);
        try {
            await apiPauseCampaign(campaign.campaignId);
            if (onStatusChange) onStatusChange(campaign.campaignId, 'paused');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to pause campaign');
        } finally { setActionLoading(false); }
    };

    const handleResume = async () => {
        setActionLoading(true);
        try {
            await apiResumeCampaign(campaign.campaignId);
            if (onStatusChange) onStatusChange(campaign.campaignId, 'active');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to resume campaign');
        } finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Cancel this campaign? All queued jobs will be stopped.')) return;
        setActionLoading(true);
        try {
            await apiDeleteCampaign(campaign.campaignId);
            if (onStatusChange) onStatusChange(campaign.campaignId, 'cancelled');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel campaign');
        } finally { setActionLoading(false); }
    };

    const c = campaign;
    const isActive    = c.status === 'active';
    const isPaused    = c.status === 'paused';
    const isTerminal  = c.status === 'completed' || c.status === 'cancelled';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name || 'Campaign Detail'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{formatNumber(c.totalLeads)} leads · <StatusBadge status={c.status} /></p>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Pause / Resume */}
                    {isActive && (
                        <button
                            onClick={handlePause}
                            disabled={actionLoading}
                            title="Pause campaign"
                            className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 disabled:opacity-40 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">pause_circle</span>
                        </button>
                    )}
                    {isPaused && (
                        <button
                            onClick={handleResume}
                            disabled={actionLoading}
                            title="Resume campaign"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 disabled:opacity-40 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">play_circle</span>
                        </button>
                    )}
                    {/* Cancel */}
                    {!isTerminal && (
                        <button
                            onClick={handleDelete}
                            disabled={actionLoading}
                            title="Cancel campaign"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 disabled:opacity-40 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                        </button>
                    )}
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 ml-1">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-5 max-h-[calc(100vh-260px)] overflow-y-auto">
                {/* Counter grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Voice */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-blue-500">call</span> Voice
                        </p>
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Queued</span><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(c.voiceQueued)}</span></div>
                            <div className="flex justify-between"><span>In Progress</span><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(c.voiceInProgress)}</span></div>
                            <div className="flex justify-between"><span>Completed</span><span className="font-semibold text-emerald-600">{formatNumber(c.voiceCompleted)}</span></div>
                            <div className="flex justify-between"><span>Failed</span><span className="font-semibold text-red-500">{formatNumber(c.voiceFailed)}</span></div>
                            <div className="flex justify-between"><span>Dead Letter</span><span className="font-semibold text-red-700">{formatNumber(c.voiceDeadLetter)}</span></div>
                        </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-emerald-500">chat</span> WhatsApp
                        </p>
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Queued</span><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(c.waQueued)}</span></div>
                            <div className="flex justify-between"><span>Completed</span><span className="font-semibold text-emerald-600">{formatNumber(c.waCompleted)}</span></div>
                            <div className="flex justify-between"><span>Failed</span><span className="font-semibold text-red-500">{formatNumber(c.waFailed)}</span></div>
                            <div className="flex justify-between"><span>Dead Letter</span><span className="font-semibold text-red-700">{formatNumber(c.waDeadLetter)}</span></div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-violet-500">mail</span> Email
                        </p>
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Queued</span><span className="font-semibold text-slate-900 dark:text-white">{formatNumber(c.emailQueued)}</span></div>
                            <div className="flex justify-between"><span>Completed</span><span className="font-semibold text-emerald-600">{formatNumber(c.emailCompleted)}</span></div>
                            <div className="flex justify-between"><span>Skipped</span><span className="font-semibold text-slate-500">{formatNumber(c.emailSkipped)}</span></div>
                            <div className="flex justify-between"><span>Failed</span><span className="font-semibold text-red-500">{formatNumber(c.emailFailed)}</span></div>
                            <div className="flex justify-between"><span>Dead Letter</span><span className="font-semibold text-red-700">{formatNumber(c.emailDeadLetter)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Dead Letters */}
                {totalDeadLetters > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base text-red-500">report</span>
                                Dead Letters ({totalDeadLetters})
                            </h4>
                            <button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {retrying
                                    ? <span className="animate-spin w-3 h-3 border-2 border-white/50 border-t-white rounded-full" />
                                    : <span className="material-symbols-outlined text-[14px]">refresh</span>
                                }
                                Retry All
                            </button>
                        </div>

                        {retryMsg && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">{retryMsg}</p>
                        )}

                        {loadingDL ? (
                            <div className="flex justify-center py-4">
                                <span className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {deadLetters.map(dl => (
                                    <div key={dl._id || dl.jobId} className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2">
                                        <span className="material-symbols-outlined text-sm text-red-500">error</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{dl.channel} job</p>
                                            {dl.lastError && <p className="text-[10px] text-slate-500 truncate">{dl.lastError}</p>}
                                        </div>
                                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                                            {dl.retryCount}/{dl.maxRetries} retries
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignPage() {
    const { user }    = useAuth();
    const { socket }  = useNotifications();
    const [campaigns, setCampaigns]         = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selectedCampaign, setSelected]   = useState(null);
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);

    const fetchCampaigns = useCallback(async (pg = 1) => {
        try {
            setLoading(true);
            const res = await apiListCampaigns({ page: pg, limit: 20 });
            setCampaigns(res.data.campaigns || []);
            setTotalPages(res.data.totalPages || 1);
            setPage(pg);
        } catch {
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns(1);
    }, [fetchCampaigns]);

    // Real-time Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleCreated = (data) => {
            // Refresh list to show new campaign
            fetchCampaigns(1);
        };

        const handleProgress = (data) => {
            setCampaigns(prev => prev.map(c =>
                c.campaignId === data.campaignId ? { ...c, ...data } : c
            ));
            // If detail panel is open, update it too
            setSelected(prev => prev && prev.campaignId === data.campaignId ? { ...prev, ...data } : prev);
        };

        socket.on('campaign_created', handleCreated);
        socket.on('campaign_progress', handleProgress);

        return () => {
            socket.off('campaign_created', handleCreated);
            socket.off('campaign_progress', handleProgress);
        };
    }, [socket, fetchCampaigns]);

    const handleUploadSuccess = () => {
        fetchCampaigns(1);
    };

    const handleSelectCampaign = async (campaign) => {
        // Fetch latest progress before showing detail
        try {
            const res = await getCampaignProgress(campaign.campaignId);
            setSelected(res.data);
        } catch {
            setSelected(campaign);
        }
    };

    const handleRetry = (campaignId) => {
        // Re-fetch to update counters
        getCampaignProgress(campaignId)
            .then(res => {
                setCampaigns(prev => prev.map(c => c.campaignId === campaignId ? res.data : c));
                setSelected(res.data);
            })
            .catch(() => {});
    };

    const handleStatusChange = (campaignId, newStatus) => {
        setCampaigns(prev => prev.map(c =>
            c.campaignId === campaignId ? { ...c, status: newStatus } : c
        ));
        setSelected(prev =>
            prev?.campaignId === campaignId ? { ...prev, status: newStatus } : prev
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Page header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-white/10">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">campaign</span>
                    Bulk Campaigns
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Upload leads in bulk and track outreach progress in real time</p>
            </div>

            <div className="flex-1 overflow-hidden flex gap-4 p-4 sm:p-6">
                {/* Left column: upload + campaign list */}
                <div className="flex flex-col gap-4 w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 overflow-y-auto">
                    <UploadPanel onSuccess={handleUploadSuccess} />

                    {/* Campaign list */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">list</span>
                            Your Campaigns
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-2">folder_open</span>
                                <p className="text-sm">No campaigns yet. Upload your first file above.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.map(c => (
                                    <CampaignCard
                                        key={c.campaignId}
                                        campaign={c}
                                        onSelect={handleSelectCampaign}
                                        isSelected={selectedCampaign?.campaignId === c.campaignId}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    onClick={() => fetchCampaigns(page - 1)}
                                    disabled={page <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-base">chevron_left</span>
                                </button>
                                <span className="flex items-center text-xs text-slate-500 px-2">{page} / {totalPages}</span>
                                <button
                                    onClick={() => fetchCampaigns(page + 1)}
                                    disabled={page >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-base">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: detail panel (shown when a campaign is selected) */}
                <div className="flex-1 min-w-0 hidden lg:block">
                    {selectedCampaign ? (
                        <CampaignDetail
                            campaign={selectedCampaign}
                            onClose={() => setSelected(null)}
                            onRetry={handleRetry}
                            onStatusChange={handleStatusChange}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                            <span className="material-symbols-outlined text-5xl mb-3">analytics</span>
                            <p className="text-sm">Select a campaign to view details</p>
                        </div>
                    )}
                </div>

                {/* Mobile: detail panel as overlay */}
                {selectedCampaign && (
                    <div className="lg:hidden fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setSelected(null)}>
                        <div className="w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                            <CampaignDetail
                                campaign={selectedCampaign}
                                onClose={() => setSelected(null)}
                                onRetry={handleRetry}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
