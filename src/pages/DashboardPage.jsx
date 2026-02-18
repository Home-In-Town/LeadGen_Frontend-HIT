import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        navigate('/select-role');
        return;
      }
      const user = JSON.parse(currentUserStr);
      const params = { userId: user.id, role: user.role };
      const res = await api.getAllUsers(params);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  return (
    <div className="animate-fade-in font-display text-charcoal pb-10">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-charcoal p-4 sm:p-5 mb-6 sm:mb-8 shadow-sm gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight">
            System Dashboard
          </h1>
          <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
            Overview & Statistics
          </p>
        </div>
        <button 
          onClick={() => navigate('/add-user')}
          className="w-full sm:w-auto bg-primary text-white py-2.5 sm:py-3 px-5 sm:px-6 font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base sm:text-lg font-black">person_add</span>
          ADD NEW
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white border-2 border-charcoal/10 p-4 sm:p-6 flex items-center justify-between hover:bg-surface-subtle transition-colors cursor-pointer" onClick={() => navigate('/users')}>
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30 mb-0.5">Total Users</h3>
            <div className="text-2xl sm:text-4xl font-black text-charcoal">{users.length}</div>
          </div>
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-charcoal/10">groups</span>
        </div>
        <div className="bg-white border-2 border-primary/20 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-0.5">System Status</h3>
            <div className="text-2xl sm:text-4xl font-black text-primary">Active</div>
          </div>
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary/20">check_circle</span>
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
    </div>
  );
};

export default DashboardPage;
