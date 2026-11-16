import React from 'react';

const StatCard = ({ title, value, subtext, subtextColor = 'green', iconType = 'suppliers' }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'suppliers':
        // Two persons silhouette icon matching screenshot
        return (
          <div className="card-illustration-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="#FF5A2B">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
        );
      case 'products':
        // 3D Isometric Package Box icon matching screenshot
        return (
          <div className="card-illustration-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF5A2B">
              <path d="M12.01 2.01L3 6.94v10.12l9.01 4.93 9.01-4.93V6.94L12.01 2.01zM12 4.25l6.75 3.7-2.92 1.6-6.75-3.7 2.92-1.6zM5.25 8.16L11.25 11.45v6.97L5.25 15.13V8.16zm7.5 10.26v-6.97l6-3.29v6.97l-6 3.29z"/>
            </svg>
          </div>
        );
      case 'purchases':
        // Shopping cart icon matching screenshot
        return (
          <div className="card-illustration-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF5A2B">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </div>
        );
      case 'expenditure':
      default:
        // Modern wallet / purse icon with clasp matching screenshot
        return (
          <div className="card-illustration-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF5A2B">
              <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-4c-1.1 0-2-.9-2-2s.9-2 2-2h4zM5 5h14v2H5V5zm14 14H5V9h7.1c-.06.32-.1.66-.1 1 0 2.21 1.79 4 4 4h3v5z"/>
              <circle cx="16" cy="12" r="1" fill="#FFFFFF"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="invento-stat-card">
      <div className="stat-card-top">
        <div className="stat-card-title-row">
          <span className="stat-card-title">{title}</span>
          <span className="stat-card-info-icon" title="View details">ⓘ</span>
        </div>
        {subtext && (
          <div className={`stat-card-subtext ${subtextColor === 'green' ? 'green' : 'grey'}`}>
            {subtext}
          </div>
        )}
      </div>

      <div className="stat-card-bottom">
        <div className="stat-card-number">{value}</div>
        {renderIcon()}
      </div>
    </div>
  );
};

export default StatCard;
