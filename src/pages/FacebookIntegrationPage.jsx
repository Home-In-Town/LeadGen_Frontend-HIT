import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacebookIntegrationPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleConnect = () => {
        const appId = import.meta.env.VITE_FB_APP_ID;
        const redirectUri = import.meta.env.VITE_FB_REDIRECT_URI;
        const scope = 'pages_show_list,pages_read_engagement,pages_manage_ads,leads_retrieval';
        
        console.log("Connecting FB with:", { appId, redirectUri });

        if (!appId || appId === 'undefined') {
            alert("Error: Facebook App ID is missing from environment variables.");
            return;
        }

        const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
        
        window.location.href = authUrl;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black uppercase mb-8">Facebook Ads Configuration</h1>
            
            <div className="border-2 border-black p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold uppercase underline">Connection Status</h2>
                    {isConnected ? (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 border border-green-800 uppercase">Connected</span>
                    ) : (
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 border border-red-800 uppercase">Disconnected</span>
                    )}
                </div>
                
                {!isConnected ? (
                    <div>
                        <p className="mb-4 text-gray-700">Connect your Facebook Page to start receiving leads directly from your Lead Ads forms.</p>
                        <button 
                            onClick={handleConnect}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 uppercase text-sm flex items-center gap-2 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                        >
                            <span className="font-bold">f</span> Connect Facebook Page
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <button className="border-2 border-black font-bold py-2 px-6 uppercase text-sm hover:bg-gray-100">Refresh Pages</button>
                        <button className="text-red-600 font-bold py-2 px-6 uppercase text-sm hover:underline">Disconnect</button>
                    </div>
                )}
            </div>

            <div className={`border-2 border-black p-6 ${!isConnected ? 'opacity-50 grayscale' : ''}`}>
                <h2 className="text-xl font-bold mb-4 uppercase underline">Form Mapping</h2>
                {!isConnected ? (
                    <p className="text-gray-500 italic">Please connect your Facebook account to manage form mappings.</p>
                ) : (
                    <div>
                        <p className="mb-4">Map your Facebook Lead forms to specific projects in your Sales Website.</p>
                        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-400">
                            <p className="text-gray-500">No forms found. Make sure you have Lead Ads forms created on your Facebook Page.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookIntegrationPage;
