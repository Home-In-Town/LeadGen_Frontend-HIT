import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Select Your Role</h1>
      
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <button 
          onClick={() => navigate('/builder-login')}
          style={{ 
            fontSize: '1.5rem', 
            padding: '1rem 3rem', 
            minWidth: '250px',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)' 
          }}
        >
          Builder
        </button>

        <button 
          onClick={() => navigate('/agent-login')}
          style={{ 
            fontSize: '1.5rem', 
            padding: '1rem 3rem', 
            minWidth: '250px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 0 20px rgba(0,0,0,0.05)' 
          }}
        >
          Agent
        </button>

        <button 
          onClick={() => navigate('/admin-login')}
          style={{ 
            fontSize: '1.5rem', 
            padding: '1rem 3rem', 
            minWidth: '250px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 0 20px rgba(0,0,0,0.05)' 
          }}
        >
          Admin
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
