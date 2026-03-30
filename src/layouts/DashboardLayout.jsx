import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAuthenticated = !!localStorage.getItem('currentUser');
  
  if (!isAuthenticated) {
    return <Navigate to="/select-role" replace />;
  }
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex font-display overflow-hidden text-charcoal">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={toggleSidebar} 
        isCollapsed={isCollapsed} 
        onToggleCollapse={toggleCollapse} 
      />
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-60'}`}>
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-6 sm:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
