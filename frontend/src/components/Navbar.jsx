import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="navbar">
      <span className="navbar-brand">Taskify Pro</span>
      <div className="navbar-user">
        {user?.name && <span className="navbar-greeting">Hi, {user.name}</span>}
        <button onClick={logout} className="btn btn-danger btn-sm">Logout</button>
      </div>
    </header>
  );
}