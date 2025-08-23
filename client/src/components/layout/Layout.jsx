import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage on first render
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="layout-container bg-background text-text-primary theme-transition">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      {/* Sidebar - Fixed positioning */}
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        toggleCollapsed={toggleSidebar}
      />
      
      {/* Main content */}
      <main className={`pt-16 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 