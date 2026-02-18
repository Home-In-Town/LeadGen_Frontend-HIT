import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const AddUserPage = () => {
  const navigate = useNavigate();
  const [manualForm, setManualForm] = useState({ name: '', phone: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      let creatorData = null;
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        creatorData = {
          userId: user.id,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        };
      }
      
      await api.createUser({ ...manualForm, createdBy: creatorData });
      navigate('/dashboard');
    } catch (err) {
        console.error(err);
      setError('Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      let creatorData = null;
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        creatorData = {
          userId: user.id,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        };
      }

      await api.uploadUser(file, creatorData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in font-display text-charcoal max-w-4xl mx-auto pb-10">
      {/* Back Button */}
      <div className="mb-6 sm:mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-charcoal text-[10px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
          DASHBOARD
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-2">
          Add New Person
        </h1>
        <p className="text-charcoal/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          Expand your lead database
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Manual Entry */}
        <div className="bg-white border-2 border-charcoal p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8 border-b-2 border-charcoal/5 pb-4">
            <span className="material-symbols-outlined text-2xl text-primary font-black">edit_note</span>
            <h2 className="text-lg font-black uppercase tracking-tight">Manual Entry</h2>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Full Name</label>
              <input
                placeholder="TYPE NAME..."
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                required
                className="w-full p-4 bg-surface-subtle border-2 border-charcoal/5 focus:border-primary focus:outline-none font-mono text-sm transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Phone Number</label>
              <input
                type="tel"
                placeholder="TYPE PHONE..."
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                required
                className="w-full p-4 bg-surface-subtle border-2 border-charcoal/5 focus:border-primary focus:outline-none font-mono text-sm transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-charcoal text-white py-4 font-black uppercase tracking-widest text-xs border-2 border-charcoal hover:bg-primary hover:border-primary transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'ADD TO SYSTEM'}
            </button>
          </form>
        </div>

        {/* File Upload */}
        <div className="bg-white border-2 border-charcoal p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8 border-b-2 border-charcoal/5 pb-4">
            <span className="material-symbols-outlined text-2xl text-blue-500 font-black">upload_file</span>
            <h2 className="text-lg font-black uppercase tracking-tight">Import Document</h2>
          </div>
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-6 leading-relaxed">
            Extract details automatically from a .docx file.
          </p>
          
          <form onSubmit={handleFileUpload} className="space-y-6 text-center">
            <div className={`border-2 border-dashed p-8 sm:p-12 transition-all duration-300 relative ${file ? 'border-emerald-500 bg-emerald-50/50' : 'border-charcoal/10 bg-surface-subtle/50 hover:border-primary/40'}`}>
              <input 
                type="file" 
                accept=".docx" 
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${file ? 'text-emerald-500' : 'text-charcoal/10'}`}>
                {file ? 'task_alt' : 'cloud_upload'}
              </span>
              <div className="space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${file ? 'text-emerald-600' : 'text-charcoal/30'}`}>
                  {file ? 'FILE LOADED' : 'Click or Drag .docx'}
                </p>
                {file && (
                  <p className="text-[9px] font-mono font-bold text-charcoal/60 truncate max-w-[200px] mx-auto">
                    {file.name}
                  </p>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={!file || loading}
              className="w-full bg-charcoal text-white py-4 font-black uppercase tracking-widest text-xs border-2 border-charcoal hover:bg-primary hover:border-primary transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'EXTRACTING...' : 'PROCESS FILE'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-500 text-red-600 text-[10px] font-black uppercase tracking-widest text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddUserPage;
