import React from 'react';

const AdminLayout = ({ children, pageTitle, noPadding = false, initiallyCollapsed = false }) => (
  <div className="admin-layout" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    <header style={{ background: '#001B3D', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{pageTitle}</h1>
       <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Admin Control Panel</div>
    </header>
    <div style={{ flex: 1, overflow: 'hidden', padding: noPadding ? '0' : '20px' }}>{children}</div>
  </div>
);

export default AdminLayout;
