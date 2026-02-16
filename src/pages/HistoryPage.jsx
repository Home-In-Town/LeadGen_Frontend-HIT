import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.getAllLeads();
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (score) => {
    if (score >= 80) return 'var(--danger)'; // HOT
    if (score >= 50) return 'var(--warning)'; // WARM
    return 'var(--success)'; // COLD (or just normal)
  };

  const statusLabel = (score) => {
    if (score >= 80) return 'HOT';
    if (score >= 50) return 'WARM';
    return 'COLD';
  };

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    const phone = (lead.phone_number || '').toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  if (loading) return <div className="animate-fade-in">Loading history...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Lead History</h2>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1.5rem' }}
        />

        {filteredLeads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No leads found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredLeads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => navigate(`/lead/${lead.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {lead.phone_number} &bull; {new Date(lead.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${statusColor(lead.score)}20`, 
                      color: statusColor(lead.score) 
                    }}
                  >
                    {statusLabel(lead.score)} ({lead.score}%)
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
