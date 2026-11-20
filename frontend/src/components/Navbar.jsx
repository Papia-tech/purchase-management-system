import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/api';

const Navbar = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchLowStock = async () => {
    try {
      const res = await productService.getLowStock(10);
      if (res.data?.success) {
        setLowStockProducts(res.data.data);
      }
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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

        {/* Bell Notification with Live Low Stock Count Badge & Dropdown */}
        <div className="notifications-dropdown-container" ref={dropdownRef}>
          <button
            className="nav-circle-btn notification-btn"
            title={lowStockProducts.length > 0 ? `${lowStockProducts.length} low stock alerts` : 'No low stock alerts'}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {lowStockProducts.length > 0 ? (
              <span className="notification-count-badge">{lowStockProducts.length}</span>
            ) : null}
          </button>

          {dropdownOpen && (
            <div className="notifications-dropdown-menu">
              <div className="notifications-dropdown-header">
                <h4>
                  <span>⚠️</span>
                  <span>Low Stock Alerts ({lowStockProducts.length})</span>
                </h4>
                <span style={{ fontSize: '11px', color: '#888' }}>Threshold: ≤ 10 units</span>
              </div>

              <div className="notifications-dropdown-list">
                {lowStockProducts.length === 0 ? (
                  <div className="notification-empty">
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>✓</div>
                    <div style={{ fontWeight: 600, color: '#10B981', marginBottom: '4px' }}>All Inventory Healthy</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>No products below the reorder threshold.</div>
                  </div>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p._id}
                      className="notification-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/products?filter=low-stock');
                      }}
                    >
                      <div className="notification-item-left">
                        <div className="notification-item-name">{p.name}</div>
                        <div className="notification-item-meta">{p.category} • ${p.price}</div>
                      </div>
                      <div>
                        <span className={`status-pill ${p.quantity === 0 ? 'out-of-stock' : 'low-stock'}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                          {p.quantity === 0 ? 'Out of stock' : `${p.quantity} units left`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lowStockProducts.length > 0 && (
                <div className="notifications-dropdown-footer">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/products?filter=low-stock');
                    }}
                  >
                    View All Low Stock Items in Catalog →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
