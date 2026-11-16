import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';

import './App.css';

function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="page-outer-container">
      <div className="dashboard-wrapper">
        {/* Top Navbar with Brand, Centered Nav Pills, and User Avatar */}
        <Navbar />

        {/* Dynamic Route Pages */}
        <Routes>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/suppliers" element={<Suppliers showToast={showToast} />} />
          <Route path="/products" element={<Products showToast={showToast} />} />
          <Route path="/purchases" element={<Purchases showToast={showToast} />} />
          <Route path="/reports" element={<Reports showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
