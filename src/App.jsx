import { useState, useEffect } from 'react';
import EmailDashboardPage from './pages/EmailDashboardPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { useNotifications } from './context/NotificationContext';
import NotificationToastContainer from './components/NotificationToast';
import LandingPage from './pages/LandingPage';
import AddUserPage from './pages/AddUserPage';
import DashboardPage from './pages/DashboardPage';
import LeadGenerationPage from './pages/LeadGenerationPage';
import HistoryPage from './pages/HistoryPage';
import UsersPage from './pages/UsersPage';
import LeadAutomationPage from './pages/LeadAutomationPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import BuilderLoginPage from './pages/BuilderLoginPage';
import AgentLoginPage from './pages/AgentLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SSOPage from './pages/SSOPage';
import FacebookIntegrationPage from './pages/FacebookIntegrationPage';
import GoogleIntegrationPage from './pages/GoogleIntegrationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ChatDashboard from './pages/ChatDashboard';
import ChatSelectionPage from './pages/ChatSelectionPage';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LeadChatSidebar from './components/lead/LeadChatSidebar';

const ComingSoonPage = () => (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in">
        <span className="material-symbols-outlined text-6xl text-charcoal/10 mb-6">explore</span>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-charcoal mb-2">Coming Soon</h1>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-charcoal/40">This feature is under development</p>
    </div>
);

// Reads toast state from context and renders the container.
// Must live inside NotificationProvider but outside Router so portals work.
function ToastRenderer() {
    const { toasts, dismissToast } = useNotifications();
    return <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

// Global Chat Sidebar Controller
function ChatSidebarController() {
    const [config, setConfig] = useState({ isOpen: false, leadId: null, leadName: null });

    useEffect(() => {
        const handleOpen = (e) => {
            setConfig({ isOpen: true, leadId: e.detail.id, leadName: e.detail.name });
        };
        window.addEventListener('open-lead-chat', handleOpen);
        return () => window.removeEventListener('open-lead-chat', handleOpen);
    }, []);

    return (
        <LeadChatSidebar 
            isOpen={config.isOpen} 
            leadId={config.leadId} 
            leadName={config.leadName} 
            onClose={() => setConfig(prev => ({ ...prev, isOpen: false }))} 
        />
    );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <ToastRenderer />
        <ChatSidebarController />
        <Routes>
        {/* Public Routes with No Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />
          <Route path="/builder-login" element={<BuilderLoginPage />} />
          <Route path="/agent-login" element={<AgentLoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/sso" element={<SSOPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Route>

        {/* Protected Routes with Dashboard Navbar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/lead/:id" element={<LeadGenerationPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/lead-automation" element={<LeadAutomationPage />} />
          <Route path="/lead-automation/:leadId" element={<LeadAutomationPage />} />
          <Route path="/chat" element={<ChatSelectionPage />} />
          <Route path="/chat/whatsapp" element={<ChatDashboard />} />
          <Route path="/chat/whatsapp/:leadId" element={<ChatDashboard />} />
          <Route path="/chat/email" element={<EmailDashboardPage />} />
          <Route path="/chat/email/:leadId" element={<EmailDashboardPage />} />
          {/* <Route path="/integrations" element={<IntegrationsPage />} /> */}
          <Route path="/integrations/facebook" element={<FacebookIntegrationPage />} />
          <Route path="/integrations/google" element={<GoogleIntegrationPage />} />
          {/* Add more protected routes here */}
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
