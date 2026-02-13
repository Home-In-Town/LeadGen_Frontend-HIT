import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
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
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>Lead Filtration</h1>
      <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px' }}>
        The advanced AI-powered system for qualifying and scoring your leads automatically.
      </p>
      
      <button 
        onClick={() => navigate('/select-role')}
        style={{ 
          fontSize: '1.5rem', 
          padding: '1rem 3rem', 
          maxWidth: '300px',
          boxShadow: '0 0 30px var(--primary-glow)' 
        }}
      >
        Start
      </button>
    </div>
  );
};

export default LandingPage;
