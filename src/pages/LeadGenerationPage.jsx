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

  // STATUS CARDS COMPONENT
  const InteractionStatus = () => {
    // Helper to render WhatsApp Status
    const renderWhatsAppStatus = () => {
      const result = leadData.whatsappResult;
      const waData = leadData.whatsappData;
      const isSent = waData?.status === 'sent';
      const isFailed = waData?.status === 'failed';
      const isVerified = result === "YES";
      const isRejected = result === "NO";
      
      return (
        <div className="simulator-card status-card">
          <div className="status-header">
            <h3>📱 WHATSAPP RESPONSE</h3>
            {result ? (
              <span className={`status-badge ${isVerified ? 'status-HOT' : 'status-COLD'}`}>
                {result}
              </span>
            ) : isSent ? (
              <span className="status-badge status-WARM">SENT</span>
            ) : isFailed ? (
              <span className="status-badge status-COLD">FAILED</span>
            ) : (
              <span className="status-badge" style={{ background: '#e0e0e0' }}>PENDING</span>
            )}
          </div>
          <div className="status-body">
            {/* Send status */}
            {isSent && !result && (
              <p>✅ Template sent. Waiting for lead's reply...</p>
            )}
            {isFailed && (
              <p className="error-text">❌ {waData?.error || 'Failed to send WhatsApp message.'}</p>
            )}
            {!waData?.status && !result && (
              <p className="text-sm text-muted">No message sent yet.</p>
            )}
            
            {/* Reply status */}
            {isVerified && <p>✅ Lead confirmed interest via WhatsApp.</p>}
            {isRejected && <p>❌ Lead rejected/opted-out via WhatsApp.</p>}
            {result === "NO_RESPONSE" && <p>⚠️ No response from lead yet.</p>}
            
            {waData?.messageSid && (
               <div className="tech-details">
                 Message ID: {waData.messageSid.slice(0, 20)}...
               </div>
            )}
            {waData?.sentAt && (
               <div className="tech-details">
                 Sent: {new Date(waData.sentAt).toLocaleString()}
               </div>
            )}
          </div>
        </div>
      );
    };

    // Helper to render AI Call Status
    const renderCallStatus = () => {
      const callData = leadData.voiceCallData;
      const aiResult = leadData.aiCallResult;
      const isCompleted = callData?.status === 'completed' || callData?.status === 'summary';
      const isFailed = callData?.status === 'failed';
      const isPending = callData && ['pending', 'queued', 'started'].includes(callData.status);

      if (!callData && !aiResult) return (
         <div className="simulator-card">
           <h3>🤖 AI Call</h3>
           <p className="text-sm text-muted">No call initiated.</p>
           <button onClick={() => api.initiateCall(id)} disabled={isPending}>
             {isPending ? 'Calling...' : 'Initiate Call Now'}
           </button>
         </div>
      );

      return (
        <div className="simulator-card status-card">
          <div className="status-header">
            <h3>🤖 AI Call Analysis</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPending && <span className="spinner-small"></span>}
                <span className={`status-badge ${isCompleted ? 'status-HOT' : isFailed ? 'status-COLD' : 'status-WARM'}`}>
                {callData?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
                <button onClick={refreshCallStatus} className="icon-btn" title="Refresh Call Status">🔄</button>
            </div>
          </div>

          <div className="status-body">
            {isFailed && <p className="error-text">❌ {callData.error || "Call failed due to unknown error."}</p>}
            
            {(isCompleted || aiResult) && (
              <div className="ai-insights">
                 <div className="insight-row">
                    <span>Interest:</span>
                    <strong>{aiResult?.interest || 'N/A'}</strong>
                 </div>
                 <div className="insight-row">
                    <span>Budget:</span>
                    <strong>{aiResult?.budget || 'N/A'}</strong>
                 </div>
                 <div className="insight-row">
                    <span>Timeline:</span>
                    <strong>{aiResult?.timeline || 'N/A'}</strong>
                 </div>
              </div>
            )}

            {callData?.recordingLink && (
              <a href={callData.recordingLink} target="_blank" rel="noopener noreferrer" className="recording-link">
                🎧 Play Recording
              </a>
            )}
            
            {callData?.transcript && (
                 <details className="transcript-details">
                    <summary>View Transcript</summary>
                    <p>{callData.transcript}</p>
                 </details>
            )}
          </div>
        </div>
      );
    };

    // Helper for Link Activity
    const renderLinkActivity = () => {
        const activity = leadData.linkActivity;
        const hasActivity = activity?.opened || activity?.submittedForm;
        
        return (
            <div className="simulator-card status-card">
              <div className="status-header">
                <h3>🔗 Link Activity</h3>
                {hasActivity ? <span className="status-badge status-HOT">ACTIVE</span> : <span className="status-badge status-COLD">INACTIVE</span>}
              </div>
              
              <div className="status-body">
                 <div className="activity-item">
                    <span className="icon">{activity?.opened ? '✅' : '⬜'}</span>
                    <span>Link Opened</span>
                 </div>
                 <div className="activity-item">
                    <span className="icon">{activity?.submittedForm ? '✅' : '⬜'}</span>
                    <span>Form Submitted</span>
                 </div>
                 {activity?.timeSpentSeconds > 0 && (
                     <div className="activity-metric">
                        ⏱️ Time Spent: <strong>{activity.timeSpentSeconds}s</strong>
                     </div>
                 )}
                 {leadData.trackingLink && (
                    <div className="tech-details">
                        <a href={leadData.trackingLink} target="_blank" rel="noopener noreferrer">Test Link ↗</a>
                    </div>
                 )}
              </div>
            </div>
        );
    };

    return (
      <div className="animate-fade-in">
        <h2 style={{ marginBottom: "1.5rem" }}>🚦 Lead Qualification Channels</h2>
        <div className="grid-container">
          {renderWhatsAppStatus()}
          {renderCallStatus()}
          {renderLinkActivity()}
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

        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
            {leadData.statusReason || "Pending analysis..."}
          </p>
        </div>

        {/* Lead Creator Info */}
        {leadData.createdBy && (
            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Created by: <strong>{leadData.createdBy.name}</strong> ({leadData.createdBy.role})
            </div>
        )}

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
        .status-card {
            border-left: 4px solid var(--border-subtle);
        }
        .status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .status-body {
            font-size: 0.95rem;
        }
        .tech-details {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            font-family: monospace;
        }
        .ai-insights {
            background: var(--bg-input);
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        .insight-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.25rem;
        }
        .transcript-details {
            margin-top: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-muted);
            cursor: pointer;
        }
        .recording-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }
        .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid var(--text-muted);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        .icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 4px;
            border-radius: 4px;
        }
        .icon-btn:hover {
            background: var(--bg-input);
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

      <InteractionStatus />
      <Summary />
    </div>
  );
};

export default LeadGenerationPage;
