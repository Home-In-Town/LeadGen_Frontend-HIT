import React from 'react';
import { Link } from 'react-router-dom';

const IntegrationsPage = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black uppercase mb-8">Integrations</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/integrations/facebook" className="border-2 border-black p-6 hover:bg-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Facebook Ads</h2>
                        <p className="text-sm text-gray-600">Sync leads from Facebook Forms</p>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <div className="border-2 border-gray-300 p-6 opacity-60 cursor-not-allowed flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-500">Google Ads</h2>
                        <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                    <span className="text-xs font-bold uppercase py-1 px-2 border border-gray-300">Soon</span>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;
