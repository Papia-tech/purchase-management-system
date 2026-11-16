import React, { useState, useEffect } from 'react';
import { purchaseService, dashboardService } from '../services/api';
import StatCard from '../components/StatCard';

const Reports = ({ showToast }) => {
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalExpenditure: 0,
    totalUnitsPurchased: 0,
    totalStock: 0
  });
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dashRes, purRes] = await Promise.all([
        dashboardService.getStats(),
        purchaseService.getAll()
      ]);
      if (dashRes.data.success) setStats(dashRes.data.data);
      if (purRes.data.success) setPurchases(purRes.data.data);
    } catch (err) {
      showToast('Error generating reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const avgOrder = stats.totalPurchases > 0 ? stats.totalExpenditure / stats.totalPurchases : 0;

  const filtered = purchases.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const pid = (p.purchaseId || p._id).toLowerCase();
    const supp = (p.supplierId?.name || '').toLowerCase();
    const prod = (p.productId?.name || '').toLowerCase();
    return pid.includes(q) || supp.includes(q) || prod.includes(q);
  });

  return (
    <div className="page-container">
      {/* Subheader Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-title-area">
          <h1>Reports</h1>
          <p>Financial summaries and transaction audit log for academic demonstration</p>
        </div>

        <div className="toolbar-actions-area">
          <div className="search-pill-container">
            <svg className="search-pill-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-pill-input"
              placeholder="Filter report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="dropdown-pill-btn" onClick={() => window.print()} title="Print or PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print Report</span>
          </button>

          <button className="btn-orange-pill" onClick={fetchReports}>
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Purchases"
          subtext="+3 this month"
          subtextColor="green"
          value={stats.totalPurchases}
          iconType="purchases"
        />

        <StatCard
          title="Total Expenditure"
          subtext="This month"
          subtextColor="grey"
          value={formatCurrency(stats.totalExpenditure)}
          iconType="expenditure"
        />

        <StatCard
          title="Average Order Value"
          subtext="Per purchase order"
          subtextColor="grey"
          value={formatCurrency(avgOrder)}
          iconType="suppliers"
        />

        <StatCard
          title="Units Procured"
          subtext="Added to stock"
          subtextColor="green"
          value={stats.totalUnitsPurchased}
          iconType="products"
        />
      </div>

      {/* Table Card */}
      <div className="invento-table-card">
        <div className="table-card-header">
          <div className="header-left-title">
            <span className="header-icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </span>
            <span className="header-title-text">Procurement Ledger Audit</span>
          </div>
          <button className="header-dots-btn" onClick={fetchReports}>
            •••
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Generating ledger report...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h4 className="empty-title">No transactions recorded</h4>
            <p className="empty-desc">Completed purchases will appear in this ledger.</p>
          </div>
        ) : (
          <div className="table-responsive-box">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="id-cell">{p.purchaseId || `#P${String(idx + 1).padStart(3, '0')}`}</td>
                    <td>{p.supplierId?.name || 'Deleted Supplier'}</td>
                    <td>{p.productId?.name || 'Deleted Product'}</td>
                    <td>{p.quantity}</td>
                    <td>{formatCurrency(p.unitPrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.totalAmount)}</td>
                    <td>{formatDate(p.purchaseDate)}</td>
                    <td>
                      <span className={`status-pill ${p.status === 'Pending' ? 'pending' : 'completed'}`}>
                        {p.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
