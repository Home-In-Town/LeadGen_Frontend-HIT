import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/Header';

const DashboardLayout = () => {
  const isAuthenticated = !!localStorage.getItem('currentUser');
  
  if (!isAuthenticated) {
    return <Navigate to="/select-role" replace />;
  }
  
  return (
    <>
      <Header showNav={true} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </>
  );
};

export default DashboardLayout;
