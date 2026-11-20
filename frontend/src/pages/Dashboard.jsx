import React, { useState, useEffect } from 'react';
import { dashboardService, purchaseService, supplierService, productService, seedService } from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import BulkImportModal from '../components/BulkImportModal';

const Dashboard = ({ showToast }) => {
  const [stats, setStats] = useState({
    totalSuppliers: 8,
    totalProducts: 48,
    totalPurchases: 23,
    totalExpenditure: 12450,
    recentPurchases: []
  });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('This Month');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // New Purchase Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    productId: '',
    quantity: 1,
    unitPrice: 0,
    status: 'Completed',
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Edit / Delete State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, suppRes, prodRes] = await Promise.all([
        dashboardService.getStats(),
        supplierService.getAll(),
        productService.getAll()
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.data);
      }
      if (suppRes.data.success) setSuppliers(suppRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      showToast('Error syncing dashboard records from MongoDB', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleResetToShoes = async () => {
    try {
      setResetting(true);
      await seedService.resetDatabase('shoes');
      await fetchDashboardData();
      showToast('Reference Footwear database loaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to reset reference database: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      supplierId: suppliers.length > 0 ? suppliers[0]._id : '',
      productId: products.length > 0 ? products[0]._id : '',
      quantity: 1,
      unitPrice: products.length > 0 ? products[0].price : 0,
      status: 'Completed',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleProductSelect = (prodId) => {
    const prod = products.find((p) => p._id === prodId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      unitPrice: prod ? prod.price : prev.unitPrice
    }));
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setFormErrors({ supplierId: 'Please select a supplier' });
      return;
    }
    if (!formData.productId) {
      setFormErrors({ productId: 'Please select a product' });
      return;
    }
    if (formData.quantity < 1) {
      setFormErrors({ quantity: 'Quantity must be at least 1' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await purchaseService.create(formData);
      if (res.data.success) {
        showToast('Purchase recorded successfully and stock updated!', 'success');
        setModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (p) => {
    setEditingPurchase(p);
    setFormData({
      status: p.status || 'Completed',
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      purchaseDate: p.purchaseDate ? p.purchaseDate.split('T')[0] : ''
    });
    setEditModalOpen(true);
  };

  const handleUpdatePurchase = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await purchaseService.update(editingPurchase._id, formData);
      if (res.data.success) {
        showToast('Purchase status updated', 'success');
        setEditModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      showToast('Failed to update purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPurchase) return;
    try {
      setSubmitting(true);
      const res = await purchaseService.delete(deletingPurchase._id);
      if (res.data.success) {
        showToast('Purchase record removed', 'success');
        setDeleteModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      showToast('Failed to delete purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPurchases = (stats.recentPurchases || []).filter((p) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const pId = (p.purchaseId || p._id).toLowerCase();
    const supp = (p.supplierId?.name || '').toLowerCase();
    const prod = (p.productId?.name || '').toLowerCase();
    return pId.includes(query) || supp.includes(query) || prod.includes(query);
  });

  return (
    <div className="page-container">
      {/* Dashboard Subheader / Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-title-area">
          <h1>Dashboard</h1>
          <p>Overview of your purchase management system</p>
        </div>

        <div className="toolbar-actions-area">
          {/* Search Pill */}
          <div className="search-pill-container">
            <svg className="search-pill-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-pill-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Period Filter Dropdown */}
          <button className="dropdown-pill-btn" onClick={() => setPeriod(period === 'This Month' ? 'All Time' : 'This Month')}>
            <span>{period}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Reset Reference Footwear Data Button */}
          <button
            className="dropdown-pill-btn"
            title="Reset database to the original reference Footwear dataset (Nike ZoomX, Adidas Adizero Pro, etc.)"
            onClick={handleResetToShoes}
            disabled={resetting}
            style={{ cursor: resetting ? 'wait' : 'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>{resetting ? 'Resetting...' : 'Reset Reference Data'}</span>
          </button>

          {/* Bulk Import Products Button */}
          <button
            className="btn-orange-pill"
            onClick={() => setImportModalOpen(true)}
            title="Bulk import products from CSV file"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Bulk Import</span>
          </button>

          {/* + New Purchase Action Button */}
          <button className="btn-orange-pill" onClick={handleOpenAddModal}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Suppliers"
          subtext="+2 new this month"
          subtextColor="green"
          value={stats.totalSuppliers}
          iconType="suppliers"
        />

        <StatCard
          title="Total Products"
          subtext="+5 new this month"
          subtextColor="green"
          value={stats.totalProducts}
          iconType="products"
        />

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
      </div>

      {/* Recent Purchases Card */}
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
            <span className="header-title-text">Recent Purchases</span>
          </div>

          <button className="header-dots-btn" title="More options" onClick={fetchDashboardData}>
            •••
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Fetching real-time records...</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h4 className="empty-title">No purchases found</h4>
            <p className="empty-desc">Click '+ New Purchase' to record your first transaction.</p>
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
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="id-cell">
                      {p.purchaseId || `#P${String(idx + 1).padStart(3, '0')}`}
                    </td>
                    <td>{p.supplierId?.name || 'Deleted Supplier'}</td>
                    <td>{p.productId?.name || 'Deleted Product'}</td>
                    <td>{p.quantity}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.totalAmount)}</td>
                    <td>{formatDate(p.purchaseDate)}</td>
                    <td>
                      <span className={`status-pill ${p.status === 'Pending' ? 'pending' : 'completed'}`}>
                        {p.status || 'Completed'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-wrap" style={{ justifyContent: 'center' }}>
                        {/* Edit Pencil Icon Button */}
                        <button
                          className="row-icon-btn"
                          title="Edit purchase"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>

                        {/* Trash Delete Icon Button */}
                        <button
                          className="row-icon-btn delete"
                          title="Delete purchase"
                          onClick={() => {
                            setDeletingPurchase(p);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order">
        <form onSubmit={handleCreatePurchase}>
          <div className="form-group">
            <label className="form-label">Supplier <span className="required">*</span></label>
            <select
              className="form-control"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">Select a supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {formErrors.supplierId && <div className="form-error">{formErrors.supplierId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Product <span className="required">*</span></label>
            <select
              className="form-control"
              value={formData.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map((pr) => (
                <option key={pr._id} value={pr._id}>
                  {pr.name} (Stock: {pr.quantity}, Price: ${pr.price})
                </option>
              ))}
            </select>
            {formErrors.productId && <div className="form-error">{formErrors.productId}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="total-calc-box">
            <div>
              <div className="total-calc-label">Total Amount</div>
              <div style={{ fontSize: '11px', color: '#777' }}>
                {formData.quantity} × {formatCurrency(formData.unitPrice)}
              </div>
            </div>
            <div className="total-calc-amount">
              {formatCurrency(formData.quantity * formData.unitPrice)}
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-orange-pill" disabled={submitting}>
              {submitting ? 'Saving...' : 'Confirm Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Purchase">
        <form onSubmit={handleUpdatePurchase}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="total-calc-box">
            <span className="total-calc-label">Total Amount</span>
            <span className="total-calc-amount">
              {formatCurrency(formData.quantity * formData.unitPrice)}
            </span>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-orange-pill" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase transaction record?"
        loading={submitting}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchDashboardData}
        showToast={showToast}
      />
    </div>
  );
};

export default Dashboard;
