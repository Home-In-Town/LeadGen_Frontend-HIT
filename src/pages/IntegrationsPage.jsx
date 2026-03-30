import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const IntegrationsPage = () => {
    const [activeTab, setActiveTab] = useState('call');
    const [agukenSettings, setAgukenSettings] = useState({ agentId: '', clientId: '' });
    const [whatsappSettings, setWhatsappSettings] = useState({ vendorUid: '', apiKey: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAgukenAgentSecret, setShowAgukenAgentSecret] = useState(false);
    const [showAgukenSecret, setShowAgukenSecret] = useState(false);
    const [showWhatsappVendorSecret, setShowWhatsappVendorSecret] = useState(false);
    const [showWhatsappSecret, setShowWhatsappSecret] = useState(false);
    const { addToast } = useNotifications();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = currentUser.token;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/owners/integrations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgukenSettings(response.data.aguken);
            setWhatsappSettings(response.data.whatsapp);
        } catch (error) {
            console.error('Error fetching integrations:', error);
            addToast('Failed to load integration settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAguken = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/api/owners/integrations/aguken`, agukenSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('Aguken settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving Aguken settings:', error);
            addToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWhatsapp = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/api/owners/integrations/whatsapp`, whatsappSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('WhatsApp settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving WhatsApp settings:', error);
            addToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <header className="mb-10">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-charcoal mb-2">Integrations</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-charcoal/40">Connect and manage your external services</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 space-y-2">
                    <button 
                        onClick={() => setActiveTab('call')}
                        className={`w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${activeTab === 'call' ? 'bg-black text-white' : 'bg-white text-charcoal hover:bg-charcoal/5'}`}
                    >
                        <span className="material-symbols-outlined text-lg">call</span>
                        Aguken Voice
                    </button>
                    <button 
                        onClick={() => setActiveTab('whatsapp')}
                        className={`w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${activeTab === 'whatsapp' ? 'bg-[#25D366] text-white' : 'bg-white text-charcoal hover:bg-charcoal/5'}`}
                    >
                        <span className="material-symbols-outlined text-lg">chat</span>
                        WhatsApp
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    {activeTab === 'call' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-primary flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-2xl">settings_voice</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-charcoal">Aguken Voice</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Setup your automated voice assistant</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveAguken} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/60 mb-2">Aguken Agent ID</label>
                                        <div className="relative">
                                            <input 
                                                type={showAgukenAgentSecret ? "text" : "password"}
                                                value={agukenSettings.agentId || ''}
                                                onChange={(e) => setAgukenSettings({...agukenSettings, agentId: e.target.value})}
                                                className="w-full bg-slate-50 border-2 border-black/5 p-4 text-sm font-medium focus:outline-none focus:border-black transition-all pr-12"
                                                placeholder="e.g. agent_abc123"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowAgukenAgentSecret(!showAgukenAgentSecret)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showAgukenAgentSecret ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/60 mb-2">Aguken Client ID</label>
                                        <div className="relative">
                                            <input 
                                                type={showAgukenSecret ? "text" : "password"}
                                                value={agukenSettings.clientId || ''}
                                                onChange={(e) => setAgukenSettings({...agukenSettings, clientId: e.target.value})}
                                                className="w-full bg-slate-50 border-2 border-black/5 p-4 text-sm font-medium focus:outline-none focus:border-black transition-all pr-12"
                                                placeholder="e.g. client_xyz789"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowAgukenSecret(!showAgukenSecret)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showAgukenSecret ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={saving}
                                            className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(37,211,102,1)] hover:shadow-[6px_6px_0px_0px_rgba(37,211,102,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? 'Saving...' : 'Save Aguken Settings'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-[#25D366] flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-2xl">chat</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-charcoal">WhatsApp Integration</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Connect via wa.homeintown.in</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveWhatsapp} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/60 mb-2">Vendor UID</label>
                                        <div className="relative">
                                            <input 
                                                type={showWhatsappVendorSecret ? "text" : "password"}
                                                value={whatsappSettings.vendorUid || ''}
                                                onChange={(e) => setWhatsappSettings({...whatsappSettings, vendorUid: e.target.value})}
                                                className="w-full bg-slate-50 border-2 border-black/5 p-4 text-sm font-medium focus:outline-none focus:border-black transition-all pr-12"
                                                placeholder="Your Vendor UID"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowWhatsappVendorSecret(!showWhatsappVendorSecret)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showWhatsappVendorSecret ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/60 mb-2">API Key</label>
                                        <div className="relative">
                                            <input 
                                                type={showWhatsappSecret ? "text" : "password"}
                                                value={whatsappSettings.apiKey || ''}
                                                onChange={(e) => setWhatsappSettings({...whatsappSettings, apiKey: e.target.value})}
                                                className="w-full bg-slate-50 border-2 border-black/5 p-4 text-sm font-medium focus:outline-none focus:border-black transition-all pr-12"
                                                placeholder="Your API Key"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowWhatsappSecret(!showWhatsappSecret)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showWhatsappSecret ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={saving}
                                            className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(37,211,102,1)] hover:shadow-[6px_6px_0px_0px_rgba(37,211,102,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? 'Saving...' : 'Save WhatsApp Settings'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;
