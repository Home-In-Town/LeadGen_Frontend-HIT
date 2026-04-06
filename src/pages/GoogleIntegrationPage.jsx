import React, { useState, useEffect } from 'react';
import { getBuilderProjects, getGoogleMappings, createGoogleMapping, deleteGoogleMapping } from '../api';

const GoogleIntegrationPage = () => {
    const [mappings, setMappings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [newMapping, setNewMapping] = useState({
        googleKey: '',
        salesWebsiteProjectId: '',
        formName: ''
    });

    const WEBHOOK_URL = `https://lead-filteration-backend-624770114041.asia-south1.run.app/api/google/webhook`;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mappingsRes, projectsRes] = await Promise.all([
                getGoogleMappings(),
                getBuilderProjects()
            ]);

            setMappings(mappingsRes.data.data || []);
            setProjects(projectsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMapping = async (e) => {
        e.preventDefault();
        if (!newMapping.googleKey || !newMapping.salesWebsiteProjectId) {
            alert('Google Key and Project are required');
            return;
        }

        setSubmitting(true);
        try {
            await createGoogleMapping(newMapping);
            
            setNewMapping({ googleKey: '', salesWebsiteProjectId: '', formName: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating mapping:', error);
            alert(error.response?.data?.error || 'Failed to create mapping');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMapping = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mapping?')) return;

        try {
            await deleteGoogleMapping(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting mapping:', error);
            alert('Failed to delete mapping');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black uppercase mb-8">Google Ads Lead Form Integration</h1>
            
            {/* Step 1: Webhook Info */}
            <div className="border-2 border-black p-6 mb-8 bg-gray-50">
                <h2 className="text-xl font-bold uppercase underline mb-4">Step 1: Configure Google Ads Webhook</h2>
                <p className="mb-4 text-gray-700">
                    Go to your <strong>Google Ads account</strong> → <strong>Lead Form Extension</strong> → <strong>Webhook</strong> settings. 
                    <br />Copy the URL and Key below into the Google Ads dashboard.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-black p-3 bg-white">
                        <label className="text-xs font-bold uppercase block mb-1">Webhook URL</label>
                        <div className="flex items-center gap-2">
                            <input 
                                readOnly 
                                value={WEBHOOK_URL} 
                                className="w-full text-sm font-mono bg-transparent border-none focus:ring-0 truncate"
                            />
                            <button 
                                onClick={() => copyToClipboard(WEBHOOK_URL)}
                                className="text-xs font-bold bg-black text-white px-2 py-1 uppercase"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                    <div className="border border-black p-3 bg-white">
                        <label className="text-xs font-bold uppercase block mb-1">Google Key (Shared Secret)</label>
                        <p className="text-sm text-gray-700 leading-tight">
                            Define a <strong>unique key</strong> in the mapping form below (e.g., <code>my_secret_key_123</code>). 
                            Use this exact same key in the "Google Key" field in your Google Ads dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 2: Create Mapping */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-xl font-bold uppercase mb-4">Add New Mapping</h2>
                        <form onSubmit={handleCreateMapping} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Google Key</label>
                                <input 
                                    type="text"
                                    value={newMapping.googleKey}
                                    onChange={(e) => setNewMapping({...newMapping, googleKey: e.target.value})}
                                    placeholder="Enter your Google shared secret"
                                    className="w-full border-2 border-black p-2 text-sm focus:outline-none focus:bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Project</label>
                                <select 
                                    value={newMapping.salesWebsiteProjectId}
                                    onChange={(e) => setNewMapping({...newMapping, salesWebsiteProjectId: e.target.value})}
                                    className="w-full border-2 border-black p-2 text-sm focus:outline-none"
                                    required
                                >
                                    <option value="">Select a Project</option>
                                    {projects.map(proj => (
                                        <option key={proj._id} value={proj._id}>{proj.projectName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Form Name (Optional)</label>
                                <input 
                                    type="text"
                                    value={newMapping.formName}
                                    onChange={(e) => setNewMapping({...newMapping, formName: e.target.value})}
                                    placeholder="e.g. Search Campaign Leads"
                                    className="w-full border-2 border-black p-2 text-sm focus:outline-none focus:bg-gray-50"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-black text-white font-bold py-3 uppercase text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                            >
                                {submitting ? 'Creating...' : 'Create Mapping'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="border-2 border-black p-6 bg-white min-h-[400px]">
                        <h2 className="text-xl font-bold uppercase mb-4 underline">Active Mappings</h2>
                        {loading ? (
                            <p className="text-center py-12">Loading mappings...</p>
                        ) : mappings.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-400">
                                <p className="text-gray-500 italic">No mappings found. Add your first mapping to start receiving Google leads.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-black">
                                            <th className="text-left p-3 text-xs font-bold uppercase">Form Name</th>
                                            <th className="text-left p-3 text-xs font-bold uppercase">Google Key</th>
                                            <th className="text-left p-3 text-xs font-bold uppercase">Project</th>
                                            <th className="text-center p-3 text-xs font-bold uppercase">Status</th>
                                            <th className="text-right p-3 text-xs font-bold uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mappings.map(m => (
                                            <tr key={m._id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-3 text-sm font-bold">{m.formName || 'Unnamed Form'}</td>
                                                <td className="p-3 text-sm font-mono">{m.googleKey}</td>
                                                <td className="p-3 text-sm">
                                                    {projects.find(p => p._id === m.salesWebsiteProjectId)?.projectName || m.salesWebsiteProjectId}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 border border-green-800 uppercase">Active</span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteMapping(m._id)}
                                                        className="text-red-600 hover:underline text-xs font-bold uppercase"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleIntegrationPage;
