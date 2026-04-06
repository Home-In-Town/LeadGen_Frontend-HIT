import { useState, useEffect } from 'react';
import EmailDashboardPage from './pages/EmailDashboardPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import NotificationToastContainer from './components/NotificationToast';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import AddUserPage from './pages/AddUserPage';
import DashboardPage from './pages/DashboardPage';
import LeadGenerationPage from './pages/LeadGenerationPage';
import HistoryPage from './pages/HistoryPage';
import UsersPage from './pages/UsersPage';
import LeadAutomationPage from './pages/LeadAutomationPage';
import FacebookIntegrationPage from './pages/FacebookIntegrationPage';
import GoogleIntegrationPage from './pages/GoogleIntegrationPage';
import IntegrationsPage from './pages/IntegrationsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ChatDashboard from './pages/ChatDashboard';
import ChatSelectionPage from './pages/ChatSelectionPage';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LeadChatSidebar from './components/lead/LeadChatSidebar';

function ToastRenderer() {
    const { toasts, dismissToast } = useNotifications();
    return <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

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
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastRenderer />
          <ChatSidebarController />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-service" element={<TermsOfServicePage />} />
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
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/integrations/facebook" element={<FacebookIntegrationPage />} />
              <Route path="/integrations/google" element={<GoogleIntegrationPage />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/select-role" element={<Navigate to="/login" replace />} />
            <Route path="/builder-login" element={<Navigate to="/login" replace />} />
            <Route path="/agent-login" element={<Navigate to="/login" replace />} />
            <Route path="/admin-login" element={<Navigate to="/login" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
