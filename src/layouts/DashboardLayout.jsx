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
      <main style={{ padding: '0 1rem' }}>
        <Outlet />
      </main>
    </>
  );
};

export default DashboardLayout;
