import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api';

const BuilderLoginPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use API_URL from api.js
      const response = await axios.post(`${API_URL}/users/login`, {
        phone: phoneNumber,
        role: 'builder'
      });

      if (response.data) {
        // Login successful
        // Store user in localStorage if needed (optional for now as per prompt)
        // Store user in localStorage with role
        const userWithRole = { ...response.data, role: 'builder' };
        localStorage.setItem('currentUser', JSON.stringify(userWithRole));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Builder not found with this phone number.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Builder Login</h1>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '350px' }}>
        <input
          type="tel"
          placeholder="Enter Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-main)'
          }}
        />
        
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            fontSize: '1.2rem', 
            padding: '1rem', 
            marginTop: '1rem',
            boxShadow: '0 0 20px var(--primary-glow)',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>
        
        <button 
          type="button"
          onClick={() => navigate('/select-role')}
          style={{ 
            fontSize: '1rem', 
            padding: '0.5rem', 
            background: 'none',
            color: 'var(--text-muted)',
            border: 'none',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Back
        </button>
      </form>
    </div>
  );
};

export default BuilderLoginPage;
