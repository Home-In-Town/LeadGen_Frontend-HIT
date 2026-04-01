import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    getEmailConnectionStatus, 
    getGoogleAuthUrl, 
    getMicrosoftAuthUrl, 
    testEmailConnection, 
    disconnectEmail 
} from '../../api';

const folders = [
    { id: 'inbox', name: 'Inbox', icon: 'inbox', color: 'text-blue-600' },
    { id: 'sent', name: 'Sent', icon: 'send', color: 'text-green-600' },
    { id: 'drafts', name: 'Drafts', icon: 'drafts', color: 'text-yellow-600' },
    { id: 'trash', name: 'Trash', icon: 'delete', color: 'text-red-500' },
    { id: 'junk', name: 'Junk', icon: 'report', color: 'text-orange-500' }
];

const EmailSidebar = ({ activeFolder, onFolderChange, onCompose }) => {
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
            console.error("Failed to fetch status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleConnect = (provider) => {
        const url = provider === 'google' ? getGoogleAuthUrl(ownerId) : getMicrosoftAuthUrl(ownerId);
        window.location.href = url;
    };

    const handleTest = async () => {
        setActionLoading(true);
        try {
            await testEmailConnection();
            alert("Connection is working perfectly!");
            fetchStatus();
        } catch (err) {
            alert(err.response?.data?.error || "Connection test failed.");
            fetchStatus();
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect this account?")) return;
        setActionLoading(true);
        try {
            await disconnectEmail();
            setConnection(null);
        } catch (err) {
            alert("Failed to disconnect.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-[280px] bg-white border-r border-charcoal/5 flex flex-col h-full shrink-0">
            {/* Compose Button */}
            <div className="p-6">
                <button
                    onClick={onCompose}
                    disabled={!connection || connection.status !== 'connected'}
                    className={`w-full text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 ${
                        connection?.status === 'connected' 
                        ? 'bg-charcoal hover:translate-y-[-2px] hover:shadow-xl' 
                        : 'bg-charcoal/20 cursor-not-allowed'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Compose</span>
                </button>
            </div>

            {/* Folder Navigation */}
            <nav className="flex-grow px-4 pb-6 space-y-1">
                {folders.map((folder) => (
                    <button
                        key={folder.id}
                        onClick={() => onFolderChange(folder.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                            activeFolder === folder.id
                                ? 'bg-charcoal/5 text-charcoal'
                                : 'text-charcoal/40 hover:bg-charcoal/[0.02] hover:text-charcoal'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={`material-symbols-outlined text-[20px] ${
                                activeFolder === folder.id ? folder.color : 'text-charcoal/20 group-hover:text-charcoal/40'
                            }`}>
                                {folder.icon}
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                                {folder.name}
                            </span>
                        </div>
                    </button>
                ))}
            </nav>

            {/* Footer / Connection State */}
            <div className="p-6 border-t border-charcoal/5 bg-charcoal/[0.01]">
                {loading ? (
                    <div className="h-10 animate-pulse bg-charcoal/5 rounded-xl"></div>
                ) : connection ? (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border transition-all ${
                            connection.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-white border-charcoal/5 shadow-sm'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    connection.provider === 'google' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                    <span className="material-symbols-outlined text-[18px]">
                                        {connection.provider === 'google' ? 'alternate_email' : 'mail'}
                                    </span>
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-charcoal/40">
                                            {connection.provider === 'google' ? 'Google' : 'Outlook'}
                                        </p>
                                        <div className={`w-2 h-2 rounded-full ${connection.status === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    </div>
                                    <p className="text-[10px] font-black text-charcoal truncate">
                                        {connection.email}
                                    </p>
                                </div>
                            </div>
                            
                            {connection.status === 'error' && (
                                <p className="mt-2 text-[9px] font-black text-red-400 uppercase leading-relaxed">
                                    {connection.errorMessage || "Authentication Failed"}
                                </p>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button 
                                    onClick={handleTest}
                                    disabled={actionLoading}
                                    className="py-2 text-[9px] font-black uppercase tracking-widest text-charcoal/60 bg-charcoal/5 hover:bg-charcoal/10 rounded-lg transition-colors border border-charcoal/5"
                                >
                                    {actionLoading ? '...' : 'Test'}
                                </button>
                                <button 
                                    onClick={handleDisconnect}
                                    className="py-2 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Recent History (Optional Mini List) */}
                        <div className="px-2">
                            <p className="text-[8px] font-black text-charcoal/20 uppercase tracking-[0.2em] mb-3">Recent Activity</p>
                            <div className="space-y-3">
                                {logs.slice(0, 3).map((log, i) => (
                                    <div key={i} className="flex items-center gap-2 opacity-60">
                                        <div className={`w-1 h-1 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                        <span className="text-[9px] font-bold text-charcoal/60 lowercase italic truncate">
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest text-center mb-2">Connect Email</p>
                        <button 
                            onClick={() => handleConnect('google')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-charcoal/10 hover:bg-charcoal/5 transition-all group"
                        >
                            <span className="material-symbols-outlined text-red-500 text-[18px]">alternate_email</span>
                            <span className="text-[10px] font-black text-charcoal">GMAIL</span>
                        </button>
                        {/* Outlook disabled for now */}
                        <button 
                            disabled
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-charcoal/10 bg-charcoal/[0.02] cursor-not-allowed opacity-50 transition-all group"
                        >
                            <span className="material-symbols-outlined text-blue-500/50 text-[18px]">mail</span>
                            <div className="flex flex-col items-start translate-y-[-1px]">
                                <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest leading-none">OUTLOOK</span>
                                <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter mt-1">Coming Soon</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSidebar;
