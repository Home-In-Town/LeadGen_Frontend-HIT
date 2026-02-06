import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../api";

const LeadGenerationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leadData, setLeadData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial data load only - NO POLLING
  // Webhooks will update the database, user clicks refresh to see updates
  useEffect(() => {
    if (id) {
      refreshData();
    }
  }, [id]);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getSummary(id);
      setLeadData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load lead data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshCallStatus = async () => {
    try {
      setIsRefreshing(true);
      await api.getCallStatus(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh call status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!leadData) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;

  // SIMULATORS
  const Simulators = () => {
    const [waReply, setWaReply] = useState(leadData.whatsappResult || "YES");
    const [aiForm, setAiForm] = useState(leadData.aiCallResult || {
      interest: "HIGH",
      budget: "MEDIUM",
      timeline: "NOW",
    });
    const [linkForm, setLinkForm] = useState(leadData.linkActivity || {
      opened: false,
      timeSpentSeconds: 0,
      submittedForm: false,
    });

    const handleWhatsApp = async () => {
      await api.updateWhatsapp(id, waReply);
      refreshData();
    };

    const handleAiCall = async () => {
      await api.updateAiCall(id, aiForm);
      refreshData();
    };

    const handleLink = async () => {
      await api.updateLinkActivity(id, linkForm);
      refreshData();
    };

    // Get call status info
    const callData = leadData.voiceCallData;
    const isCallInProgress = callData && ['pending', 'queued', 'started'].includes(callData.status);
    const isCallCompleted = callData && ['completed', 'summary'].includes(callData.status);
    const isCallFailed = callData && callData.status === 'failed';

    const getCallStatusDisplay = () => {
      if (!callData) return null;
      switch (callData.status) {
        case 'pending': return { icon: '🔄', text: 'Initiating call...', color: 'var(--warning, orange)' };
        case 'queued': return { icon: '⏳', text: 'Call queued...', color: 'var(--warning, orange)' };
        case 'started': return { icon: '📞', text: 'Call in progress...', color: 'var(--primary)' };
        case 'completed': case 'summary': return { icon: '✅', text: 'Call completed', color: 'var(--success)' };
        case 'failed': return { icon: '❌', text: 'Call failed', color: 'var(--error, red)' };
        default: return null;
      }
    };

    const callStatus = getCallStatusDisplay();

    return (
      <div className="animate-fade-in">
        <h2 style={{ marginBottom: "1.5rem" }}>🚦 Lead Qualification Channels</h2>
        <div className="grid-container">
          {/* WhatsApp Card */}
          <div className="simulator-card">
            <h3>📱 WhatsApp Response</h3>
            <label>User Reply</label>
            <select value={waReply} onChange={(e) => setWaReply(e.target.value)}>
              <option value="YES">Reply: YES</option>
              <option value="NO">Reply: NO</option>
              <option value="NO_RESPONSE">No Response</option>
            </select>
            <button onClick={handleWhatsApp}>Simulate Reply</button>
          </div>

          {/* AI Call Card - WITH PROCESSING STATE */}
          <div className="simulator-card" style={{ 
            borderTop: callStatus ? `3px solid ${callStatus.color}` : undefined,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0 }}>🤖 AI Call Analysis</h3>
              {callData && (
                <button 
                  onClick={refreshCallStatus}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  🔄
                </button>
              )}
            </div>

            {/* Call Status Banner */}
            {callStatus && (
              <div style={{ 
                background: `${callStatus.color}20`,
                padding: '0.75rem',
                borderRadius: '6px',
                marginTop: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {isCallInProgress && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTopColor: callStatus.color,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    flexShrink: 0
                  }} />
                )}
                {!isCallInProgress && (
                  <span style={{ fontSize: '1.2rem' }}>{callStatus.icon}</span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: callStatus.color, fontSize: '0.9rem' }}>
                    {callStatus.text}
                  </div>
                  {isCallInProgress && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Waiting for call to complete...
                    </div>
                  )}
                  {isCallCompleted && callData.duration > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Duration: {Math.floor(callData.duration / 60)}:{String(callData.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                  {isCallFailed && callData.error && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {callData.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript Section - Only show if completed */}
            {isCallCompleted && callData.transcript && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  📝 Transcript
                </div>
                <div style={{ 
                  background: 'var(--bg-input)', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  fontSize: '0.8rem',
                  lineHeight: '1.5'
                }}>
                  {callData.transcript}
                </div>
              </div>
            )}

            {/* Recording Link */}
            {isCallCompleted && callData.recordingLink && (
              <div style={{ marginBottom: '1rem' }}>
                <a 
                  href={callData.recordingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    textDecoration: 'none'
                  }}
                >
                  🎧 Listen to Recording →
                </a>
              </div>
            )}

            {/* Auto-populated indicator */}
            {callData?.contributed && (
              <div style={{ 
                background: 'rgba(0,255,0,0.1)', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--success)'
              }}>
                ✅ Results auto-populated from call
              </div>
            )}

            {/* Form fields */}
            <label>Interest Level</label>
            <select
              value={aiForm.interest}
              onChange={(e) => setAiForm({ ...aiForm, interest: e.target.value })}
              disabled={isCallInProgress}
            >
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <label>Budget</label>
            <select
              value={aiForm.budget}
              onChange={(e) => setAiForm({ ...aiForm, budget: e.target.value })}
              disabled={isCallInProgress}
            >
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <label>Timeline</label>
            <select
              value={aiForm.timeline}
              onChange={(e) => setAiForm({ ...aiForm, timeline: e.target.value })}
              disabled={isCallInProgress}
            >
              <option value="NOW">NOW</option>
              <option value="LATER">LATER</option>
            </select>
            <button 
              onClick={handleAiCall} 
              disabled={isCallInProgress}
              style={{ opacity: isCallInProgress ? 0.5 : 1 }}
            >
              {isCallInProgress ? 'Waiting for call...' : 'Update Call Outcome'}
            </button>
          </div>

          {/* Link Click Card */}
          <div className="simulator-card">
            <h3>🔗 Link Activity</h3>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={linkForm.opened}
                  onChange={(e) => setLinkForm({ ...linkForm, opened: e.target.checked })}
                />
                Link Opened
              </label>
            </div>
            <label>Time Spent (sec)</label>
            <input
              type="number"
              value={linkForm.timeSpentSeconds}
              onChange={(e) => setLinkForm({ ...linkForm, timeSpentSeconds: Number(e.target.value) })}
            />
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={linkForm.submittedForm}
                  onChange={(e) => setLinkForm({ ...linkForm, submittedForm: e.target.checked })}
                />
                Form Submitted
              </label>
            </div>
            <button onClick={handleLink}>Simulate Activity</button>
          </div>
        </div>
      </div>
    );
  };

  // Helper to get status class
  const getStatusClass = (status) => {
    switch(status) {
      case 'HOT': return 'status-HOT';
      case 'WARM': return 'status-WARM';
      case 'COLD': return 'status-COLD';
      default: return 'status-NEW';
    }
  };

  const Summary = () => {
    return (
      <div className="card animate-fade-in" style={{ marginTop: '30px', borderTop: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>EXECUTIVE SUMMARY</h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {leadData.first_name} {leadData.last_name}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{leadData.phone_number}</div>
          </div>
          <span className={`status-badge ${getStatusClass(leadData.status)}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {leadData.status}
          </span>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
            {leadData.statusReason || "Pending analysis..."}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)' }}>AI Confidence Score:</span>
          <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${leadData.score || 0}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{leadData.score || 0}/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <button className="secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: '2rem', width: 'auto' }}>
        &larr; Back to Dashboard
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Processing Lead ID: <strong style={{ color: 'var(--text-main)' }}>{id}</strong>
        </span>
      </div>

      <Simulators />
      <Summary />
    </div>
  );
};

export default LeadGenerationPage;
