import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        phone: phoneNumber,
        role: 'admin'
      });

      if (response.data) {
        const adminUser = { ...response.data, role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Admin not found with this phone number.');
      } else if (err.response && err.response.status === 403) {
        setError('Admin account inactive.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in bg-background-light min-h-[85vh] font-display text-charcoal flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border-2 shadow-lg border-charcoal/20 p-8 bg-white">
          <div className="text-center mb-8 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-charcoal/40 mb-3">
              settings_accessibility
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
              ADMIN LOGIN
            </h1>
          </div>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-1">
                TYPE PHONE NUMBER:
              </label>
              <input
                type="tel"
                placeholder="00000 00000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full p-4 bg-surface-subtle border-2 border-charcoal/10 focus:border-charcoal/40 focus:outline-none font-mono text-lg text-center transition-all"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-lg font-bold">warning</span>
                <p className="text-red-600 text-[10px] font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-charcoal text-white py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'WAIT...' : 'LOGIN'}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/select-role')}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal flex items-center justify-center gap-2 cursor-pointer py-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              GO BACK
            </button>
          </form>
        </div>

        <div className="mt-8 text-center opacity-20">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em]">
            SYSTEM_PROTOCOL // ROOT_ACCESS
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
