import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleCreateLead = async (user) => {
    if (processingId || deletingId) return;
    setProcessingId(user.id);
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        alert('Please login first to create a lead.');
        navigate('/select-role');
        return;
      }
      const currentUser = JSON.parse(currentUserStr);
      const creatorData = {
        creatorId: currentUser.id,
        creatorName: `${currentUser.first_name} ${currentUser.last_name}`,
        creatorRole: currentUser.role || 'agent'
      };

      const res = await api.createLeadFromUser(user.id, creatorData);
      // REDIRECTION FIX: Check for both id and _id to ensure navigation happens
      const leadId = res.data.id || res.data._id;
      if (leadId) {
        navigate(`/lead/${leadId}`);
      } else {
        console.error('Lead created but ID missing in response:', res.data);
        alert('Lead created but redirection failed. Please check History.');
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
      alert('Failed to create lead');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (e, userId) => {
    e.stopPropagation(); // Prevent triggering the row click
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setDeletingId(userId);
    try {
      await api.deleteUser(userId);
      // Optimistically remove from state
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    } finally {
      setDeletingId(null);
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
            Manage your leads and users
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
        <div className="bg-white border-2 border-charcoal/10 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30 mb-0.5">Total People</h3>
            <div className="text-2xl sm:text-4xl font-black text-charcoal">{users.length}</div>
          </div>
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-charcoal/10">groups</span>
        </div>
        <div className="bg-white border-2 border-primary/20 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-0.5">Ready Now</h3>
            <div className="text-2xl sm:text-4xl font-black text-primary">{users.length}</div>
          </div>
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary/20">check_circle</span>
        </div>
      </div>

      {/* User List Title */}
      <div className="mb-4 sm:mb-6 border-b-2 border-charcoal/5 pb-2">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-lg sm:text-xl font-bold">list_alt</span>
          User Records
        </h2>
      </div>
      
      {users.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-charcoal/10 p-10 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl sm:text-5xl text-charcoal/10 mb-3">person_off</span>
            <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">No users added yet.</p>
            <button 
              onClick={() => navigate('/add-user')}
              className="px-5 py-2 bg-charcoal text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all cursor-pointer"
            >
              Add First Person
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-10 sm:mb-16">
          {users.map((user) => (
            <div 
              key={user.id}
              className="bg-white border hover:border-primary p-2 sm:p-3 transition-all flex flex-row items-center justify-between gap-4 group"
            >
              <div className="flex flex-row items-center gap-3 text-left flex-1 min-w-0 overflow-hidden">
                <div className="bg-surface-subtle p-1.5 border border-charcoal/5 group-hover:bg-primary/5 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-xl text-charcoal/30 group-hover:text-primary">
                    person
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-tighter truncate leading-none mb-1">
                    {user.first_name} {user.last_name}
                  </h3>
                  <div className="font-mono text-charcoal/40 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-tight">
                    <span className="material-symbols-outlined text-[10px]">call</span>
                    {user.phone_number}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleCreateLead(user)}
                  disabled={processingId || deletingId}
                  className="bg-primary text-white px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Start Lead"
                >
                  <span className="material-symbols-outlined text-[14px] font-black">bolt</span>
                  <span className="hidden xs:inline">{processingId === user.id ? 'WAIT' : 'START'}</span>
                </button>
                
                <button 
                  onClick={(e) => handleDeleteUser(e, user.id)}
                  disabled={processingId || deletingId === user.id}
                  className="bg-white text-red-600 px-2 py-1.5 font-black uppercase tracking-widest text-[9px] border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-base font-black">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
