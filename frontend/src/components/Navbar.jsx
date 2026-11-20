import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Products', path: '/products' },
    { name: 'Purchases', path: '/purchases' },
    { name: 'Reports', path: '/reports' }
  ];

  return (
    <header className="top-navbar">
      {/* Brand Logo & Name */}
      <div className="navbar-brand">
        <div className="brand-logo-icon">
          {/* Custom 3D isometric inventory cube glyph (no asterisk / no Claude similarity) */}
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#FFFFFF" fillOpacity="0.95" />
            <path d="M3.5 16.8L12 21.5V12L3.5 7.2V16.8Z" fill="#FFFFFF" fillOpacity="0.75" />
            <path d="M20.5 16.8L12 21.5V12L20.5 7.2V16.8Z" fill="#FFFFFF" fillOpacity="0.88" />
          </svg>
        </div>
        <span className="brand-title-text">INVENTO</span>
      </div>

      {/* Center Pill Navigation */}
      <nav className="navbar-nav-pills">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="navbar-right-controls">
        {/* Mail Icon Button */}
        <button className="nav-circle-btn" title="Messages">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </button>

        {/* Bell Notification with Red Dot */}
        <button className="nav-circle-btn notification-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-dot"></span>
        </button>

        {/* User Profile Avatar */}
        <div className="user-avatar-container" title="Administrator Profile">
          <img
            src="https://as2.ftcdn.net/v2/jpg/06/35/83/71/1000_F_635837130_D9mM6kJZTdTBUVCQmxE8WzoNlq1sJTN7.jpg"
            alt="Admin Avatar"
            className="navbar-avatar-img"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
