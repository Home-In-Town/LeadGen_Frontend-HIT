import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import NotificationToastContainer from './components/NotificationToast';

// Eagerly loaded (above the fold / always needed)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LeadChatSidebar from './components/lead/LeadChatSidebar';

// Lazy-loaded pages — only downloaded when the route is visited
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AddUserPage = lazy(() => import('./pages/AddUserPage'));
const LeadGenerationPage = lazy(() => import('./pages/LeadGenerationPage'));
const CRMPage = lazy(() => import('./pages/CRMPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const LeadAutomationPage = lazy(() => import('./pages/LeadAutomationPage'));
const ChatSelectionPage = lazy(() => import('./pages/ChatSelectionPage'));
const ChatDashboard = lazy(() => import('./pages/ChatDashboard'));
const EmailDashboardPage = lazy(() => import('./pages/EmailDashboardPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const FacebookIntegrationPage = lazy(() => import('./pages/FacebookIntegrationPage'));
const GoogleIntegrationPage = lazy(() => import('./pages/GoogleIntegrationPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );
}

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
          <Suspense fallback={<PageLoader />}>
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
                <Route path="/crm" element={<CRMPage />} />
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
              <Route path="/history" element={<Navigate to="/crm" replace />} />
              <Route path="/select-role" element={<Navigate to="/login" replace />} />
              <Route path="/builder-login" element={<Navigate to="/login" replace />} />
              <Route path="/agent-login" element={<Navigate to="/login" replace />} />
              <Route path="/admin-login" element={<Navigate to="/login" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
