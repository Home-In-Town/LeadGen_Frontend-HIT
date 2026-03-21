import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  const fetchUsers = useCallback(async () => {
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
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkCreateLead = async () => {
    if (selectedUsers.size === 0) return;
    setFetchingProjects(true);
    try {
      const res = await api.getBuilderProjects();
      const projList = res.data.data || [];
      if (projList.length === 0) {
        alert("No projects available");
        setFetchingProjects(false);
        return;
      }
      setProjects(projList);
      setShowProjectModal(true);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      alert("Failed to fetch projects");
    } finally {
      setFetchingProjects(false);
    }
  };

  const executeBulkCreate = async (projectSlug, projectName) => {
    setShowProjectModal(false);
    setProcessing(true);
    
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        alert('Please login first.');
        return;
      }
      const currentUser = JSON.parse(currentUserStr);
      const creatorData = {
        creatorId: currentUser.id,
        creatorName: `${currentUser.first_name} ${currentUser.last_name}`,
        creatorRole: currentUser.role || 'agent',
        projectSlug,
        projectName
      };

      const promises = Array.from(selectedUsers).map(userId => 
        api.createLeadFromUser(userId, creatorData)
          .catch(err => ({ error: err, userId })) 
      );

      await Promise.all(promises);
      
      alert(`Process started for ${selectedUsers.size} users.`);
      setSelectedUsers(new Set()); // Clear selection
    } catch (err) {
      console.error('Bulk create failed:', err);
      alert('Failed to process some requests.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) return;
    
    setProcessing(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        api.deleteUser(userId).catch(err => ({ error: err, userId }))
      );

      await Promise.all(promises);
      
      // Update UI
      setUsers(users.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete some users.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in font-display text-charcoal pb-10">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-charcoal p-4 sm:p-5 mb-6 sm:mb-8 shadow-sm gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight">
            User Management
          </h1>
          <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
            Manage all registered users
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

      {/* Stats & Search Bar */}
      <div className="bg-white border-2 border-charcoal/10 p-4 sm:p-6 mb-8 sm:mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-charcoal/10">groups</span>
          <div>
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30 mb-0.5">Total Users</h3>
            <div className="text-2xl sm:text-4xl font-black text-charcoal">{filteredUsers.length}</div>
          </div>
        </div>
        
        <div className="w-full sm:w-auto flex-1 max-w-md">
           <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 text-lg">search</span>
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-subtle border-2 border-transparent focus:border-charcoal/20 pl-10 pr-4 py-2 text-sm font-bold placeholder-charcoal/30 outline-none transition-all"
            />
           </div>
        </div>
      </div>

      {/* User List Section */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-charcoal/5 pb-2">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-lg sm:text-xl font-bold">list_alt</span>
          User Records
        </h2>

        {/* Bulk Actions Toolbar */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto animate-fade-in">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mr-2">
              {selectedUsers.size} Selected
            </span>
            <button 
              onClick={handleBulkCreateLead}
              disabled={processing || fetchingProjects}
              className="bg-primary text-white px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px] font-black">bolt</span>
              START LEAD
            </button>
            <button 
              onClick={handleBulkDelete}
              disabled={processing}
              className="bg-red-600 text-white px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border border-red-600 hover:bg-white hover:text-red-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px] font-black">delete</span>
              DELETE
            </button>
          </div>
        )}
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-charcoal/10 p-10 sm:p-12 text-center">
            {searchQuery ? (
              <>
                <span className="material-symbols-outlined text-4xl sm:text-5xl text-charcoal/10 mb-3">search_off</span>
                <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">No users match "{searchQuery}".</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 bg-charcoal text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl sm:text-5xl text-charcoal/10 mb-3">person_off</span>
                <p className="text-charcoal/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">No users added yet.</p>
                <button 
                  onClick={() => navigate('/add-user')}
                  className="px-5 py-2 bg-charcoal text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all cursor-pointer"
                >
                  Add First Person
                </button>
              </>
            )}
        </div>
      ) : (
        <div className="bg-white border-2 border-charcoal">
          {/* List Header */}
          <div className="flex items-center gap-4 p-3 border-b-2 border-charcoal/5 bg-surface-subtle">
            <input 
              type="checkbox" 
              onChange={handleSelectAll}
              checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
              className="w-4 h-4 accent-charcoal cursor-pointer"
            />
            <div className="text-[9px] font-black uppercase tracking-widest text-charcoal/40 flex-1">User Details</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-charcoal/40 w-32 hidden sm:block">Phone</div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-charcoal/5">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className={`flex items-center gap-4 p-3 transition-colors ${selectedUsers.has(user.id) ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedUsers.has(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="w-4 h-4 accent-charcoal cursor-pointer shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-charcoal uppercase tracking-tight truncate">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="sm:hidden text-[10px] font-mono text-charcoal/50 mt-0.5">
                    {user.phone_number}
                  </div>
                </div>

                <div className="hidden sm:block w-32 font-mono text-xs text-charcoal/60 truncate">
                  {user.phone_number}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-charcoal/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border-2 border-charcoal shadow-lg">
            <div className="flex justify-between items-center p-4 border-b-2 border-charcoal/10">
              <h2 className="text-lg font-black uppercase tracking-tight">Select Project</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-charcoal/50 hover:text-charcoal cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-charcoal/50 uppercase font-bold tracking-widest mb-3">Choose project to link leads</p>
              <div className="space-y-2">
                {projects.map(p => (
                  <button
                    key={p._id || p.id || p.slug}
                    onClick={() => executeBulkCreate(p.slug, p.projectName)}
                    className="w-full text-left p-3 border-2 border-charcoal/10 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer font-bold"
                  >
                    {p.projectName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
