import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import IntegrationSelectorModal from '../components/IntegrationSelectorModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      if (!user) return;
      const params = { userId: user.id, role: user.role };
      const res = await api.getAllUsers(params);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="animate-fade-in font-display text-charcoal pb-10">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-charcoal p-3 sm:p-5 mb-5 sm:mb-8 shadow-sm gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight">
            System Dashboard
          </h1>
          <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
            Overview & Statistics
          </p>
        </div>
        <button 
          onClick={() => navigate('/add-user')}
          className="w-full sm:w-auto bg-primary text-white py-2 sm:py-3 px-4 sm:px-6 font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base sm:text-lg font-black">person_add</span>
          ADD NEW
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-6 mb-6 sm:mb-10">
        <div className="bg-white border-2 border-charcoal/10 p-3 sm:p-6 flex items-center justify-between hover:bg-surface-subtle transition-colors cursor-pointer" onClick={() => navigate('/users')}>
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30 mb-0.5">Total Users</h3>
            <div className="text-2xl sm:text-4xl font-black text-charcoal">{users.length}</div>
          </div>
          <span className="material-symbols-outlined text-2xl sm:text-4xl text-charcoal/10">groups</span>
        </div>
        <div className="bg-white border-2 border-primary/20 p-3 sm:p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-0.5">System Status</h3>
            <div className="text-2xl sm:text-4xl font-black text-primary">Active</div>
          </div>
          <span className="material-symbols-outlined text-2xl sm:text-4xl text-primary/20">check_circle</span>
        </div>
      </div>
      
      {/* Tools & Settings Section */}
      <div className="mb-10 sm:mb-12">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <h2 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-charcoal/40 whitespace-nowrap">
            Tools & Settings
          </h2>
          <div className="h-[1px] w-full bg-charcoal/5"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Integrations Card */}
          <div 
            onClick={() => setIsIntegrationModalOpen(true)}
            className="group bg-white border-2 border-charcoal p-4 sm:p-6 hover:bg-charcoal transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-charcoal group-hover:text-white transition-colors text-2xl">
                  hub
                </span>
                <div className="flex gap-2">
                  {/* Google Logo */}
                  <div className="w-6 h-6 bg-white border border-charcoal/10 rounded-sm p-1 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  {/* Facebook Logo */}
                  <div className="w-6 h-6 bg-[#1877F2] border border-[#1877F2] rounded-sm p-1 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight text-charcoal group-hover:text-white transition-colors mb-1">
                Integrations
              </h3>
              <p className="text-[10px] font-bold text-charcoal/40 group-hover:text-white/40 transition-colors uppercase tracking-wider">
                Connect external sources
              </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary group-hover:text-primary-light transition-colors">
                  2 Integrations Active
                </span>
              </div>
              <span className="material-symbols-outlined text-charcoal/20 group-hover:text-white/20 transition-colors">
                arrow_forward
              </span>
            </div>

            {/* Background design element */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-charcoal/5 group-hover:bg-white/5 rotate-12 transition-all"></div>
          </div>
        </div>
      </div>
      
      {/* Empty State / CTA if no users */}
      {users.length === 0 && (
        <div className="bg-white border-2 border-dashed border-charcoal/10 p-10 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl sm:text-5xl text-charcoal/10 mb-3">person_off</span>
            <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">No data in system.</p>
            <button 
              onClick={() => navigate('/add-user')}
              className="px-5 py-2 bg-charcoal text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all cursor-pointer"
            >
              Add First Person
            </button>
        </div>
      )}
      {/* Integration Selector Modal */}
      <IntegrationSelectorModal 
        isOpen={isIntegrationModalOpen} 
        onClose={() => setIsIntegrationModalOpen(false)} 
      />
    </div>
  );
};

export default DashboardPage;
