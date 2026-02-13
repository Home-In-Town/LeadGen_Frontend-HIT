import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateLead = async (user) => {
    setLoading(true);
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
      setLoading(false);
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
          <button onClick={() => setShowUserList(!showUserList)} style={{ width: 'auto' }}>
            {showUserList ? 'Hide Users' : 'Create Lead'}
          </button>
        </div>
      </div>

      {/* User List Panel */}
      {showUserList && (
        <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Select a User to Create Lead</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            📊 Selecting a user will create a lead and initiate all qualification processes (WhatsApp, AI Call, Link Tracking).
          </p>
          
          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              No users added yet. <span onClick={() => navigate('/add-user')} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Add one now</span>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => !loading && handleCreateLead(user)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    background: 'var(--bg-input)',
                    borderRadius: '8px',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--primary)')}
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
                  <span style={{ color: 'var(--primary)', fontWeight: '500' }}>
                    {loading ? '⏳ Creating...' : 'Select →'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats/Info Cards */}
      <div className="grid-container">
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
    </div>
  );
};

export default DashboardPage;


