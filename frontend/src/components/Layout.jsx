import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-body">
        <Sidebar />
        <main className="page-main">{children}</main>
      </div>
    </div>
  );
}