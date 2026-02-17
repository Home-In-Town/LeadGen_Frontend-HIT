import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const AddUserPage = () => {
  const navigate = useNavigate();
  const [manualForm, setManualForm] = useState({ name: '', phone: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      let creatorData = null;
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        creatorData = {
          userId: user.id,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        };
      }
      
      await api.createUser({ ...manualForm, createdBy: creatorData });
      navigate('/dashboard');
    } catch (err) {
        console.error(err);
      setError('Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      let creatorData = null;
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        creatorData = {
          userId: user.id,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        };
      }

      await api.uploadUser(file, creatorData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <button className="secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: '2rem', width: 'auto' }}>
        &larr; Back
      </button>

      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Add New User</h1>

      <div className="grid-container">
        {/* Manual Entry */}
        <div className="card">
          <h2>📝 Manual Entry</h2>
          <form onSubmit={handleManualSubmit}>
            <label>Full Name</label>
            <input
              placeholder="e.g. John Doe"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              required
            />
            <label>Phone Number</label>
            <input
              placeholder="e.g. +1 555 000 0000"
              value={manualForm.phone}
              onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* File Upload */}
        <div className="card">
          <h2>📂 Upload Document</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Upload a .docx file containing Name and Phone number.
          </p>
          <form onSubmit={handleFileUpload}>
            <div style={{ 
              border: '2px dashed var(--border-subtle)', 
              borderRadius: '8px', 
              padding: '2rem', 
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <input 
                type="file" 
                accept=".docx" 
                onChange={(e) => setFile(e.target.files[0])}
                style={{ background: 'transparent', border: 'none' }}
              />
            </div>
            <button type="submit" disabled={!file || loading}>
              {loading ? 'Extracting...' : 'Upload & Add User'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'var(--danger-bg)', 
          color: 'var(--danger)', 
          borderRadius: '8px',
          textAlign: 'center' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AddUserPage;
