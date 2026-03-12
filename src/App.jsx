import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
// import IntegrationsPage from './pages/IntegrationsPage';
import FacebookIntegrationPage from './pages/FacebookIntegrationPage';
import GoogleIntegrationPage from './pages/GoogleIntegrationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with No Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />
          <Route path="/builder-login" element={<BuilderLoginPage />} />
          <Route path="/agent-login" element={<AgentLoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/sso" element={<SSOPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
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
          {/* <Route path="/integrations" element={<IntegrationsPage />} /> */}
          <Route path="/integrations/facebook" element={<FacebookIntegrationPage />} />
          <Route path="/integrations/google" element={<GoogleIntegrationPage />} />
          {/* Add more protected routes here */}
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
