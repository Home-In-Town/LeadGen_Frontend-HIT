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
        creatorRole: currentUser.role || 'agent' // Default to agent if role missing
      };

      const res = await api.createLeadFromUser(user.id, creatorData);
      // Navigate immediately - call processing shown on lead page
      navigate(`/lead/${res.data.id}`);
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
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="secondary" onClick={() => navigate('/add-user')} style={{ width: 'auto' }}>
            + Add User
          </button>
        </div>
      </div>

      {/* Stats/Info Cards */}
      <div className="grid-container" style={{ marginBottom: '3rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Users</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {users.length}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ready to Process</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {users.length}
          </div>
        </div>
      </div>

      {/* User List Panel */}
      {showUserList && (
        <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Users</h3>
          
          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              No users added yet. <span onClick={() => navigate('/add-user')} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Add one now</span>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map((user) => (
                <div 
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    background: 'var(--bg-input)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {user.phone_number}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => handleCreateLead(user)}
                      disabled={processingId || deletingId}
                      style={{ 
                        fontSize: '0.9rem', 
                        padding: '0.5rem 1rem',
                        width: 'auto'
                      }}
                    >
                      {processingId === user.id ? 'Processing...' : 'Create Lead'}
                    </button>
                    
                    <button 
                      className="secondary"
                      onClick={(e) => handleDeleteUser(e, user.id)}
                      disabled={processingId || deletingId === user.id}
                      style={{ 
                        fontSize: '0.9rem', 
                        padding: '0.5rem 1rem',
                        width: 'auto',
                        background: 'rgba(255, 0, 0, 0.1)',
                        color: 'var(--error, #ef4444)',
                        border: '1px solid transparent'
                      }}
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
