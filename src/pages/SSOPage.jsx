import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api';

const SSOPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('No security token found. Please try again from the Sales Website dashboard.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        // Use the new SSO verify endpoint (which is under /api/leads)
        // Note: API_URL in lead-filtration/frontend/src/api.js is `${BASE_URL}/api/leads`
        const response = await axios.post(`${API_URL}/users/sso/verify`, { token });
        
        if (response.data) {
          // SSO successful
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          localStorage.setItem('token', token);
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } catch (err) {
        console.error('SSO Verification Error:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Security check failed. The link might be expired. Please try again.');
        }
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="animate-fade-in bg-background-light min-h-screen font-display text-charcoal flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border-2 shadow-lg border-blue-500 p-12 bg-white text-center">
          
          {loading && !error ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="space-y-2">
                <h1 className="text-xl font-black uppercase tracking-tighter">
                  SECURE ACCESS
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/40">
                  Verifying Identity Profile...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-6">
              <span className="material-symbols-outlined text-6xl text-red-500">
                gpp_bad
              </span>
              <div className="space-y-4">
                <h1 className="text-xl font-black uppercase tracking-tighter text-red-500">
                  ACCESS DENIED
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/60 leading-relaxed max-w-[200px] mx-auto">
                  {error}
                </p>
                
                <button 
                  onClick={() => navigate('/select-role')}
                  className="mt-4 px-8 py-3 bg-charcoal text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all"
                >
                  MANUAL LOGIN
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <span className="material-symbols-outlined text-6xl text-emerald-500 animate-bounce">
                verified_user
              </span>
              <div className="space-y-2">
                <h1 className="text-xl font-black uppercase tracking-tighter text-emerald-500">
                  IDENTITY VERIFIED
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/40">
                  Redirecting to Dashboard...
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="mt-8 text-center opacity-20">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em]">
            SSO_PROTOCOL // HANDOVER_GATEWAY
          </p>
        </div>
      </div>
    </div>
  );
};

export default SSOPage;
