import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-label">Workspace</div>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`sidebar-link ${pathname === link.to ? 'active' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </aside>
  );
}