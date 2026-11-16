import React, { useState, useEffect } from 'react';
import { purchaseService, productService, supplierService } from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const initialForm = {
  supplierId: '',
  productId: '',
  quantity: 1,
  unitPrice: 0,
  status: 'Completed',
  purchaseDate: new Date().toISOString().split('T')[0]
};

const Purchases = ({ showToast }) => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [selectedProductObj, setSelectedProductObj] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Edit / Delete State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, suppRes, prodRes] = await Promise.all([
        purchaseService.getAll(),
        supplierService.getAll(),
        productService.getAll()
      ]);

      if (purRes.data.success) setPurchases(purRes.data.data);
      if (suppRes.data.success) setSuppliers(suppRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      showToast('Error loading purchase records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      supplierId: suppliers.length > 0 ? suppliers[0]._id : '',
      productId: products.length > 0 ? products[0]._id : '',
      quantity: 1,
      unitPrice: products.length > 0 ? products[0].price : 0,
      status: 'Completed',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setSelectedProductObj(products.length > 0 ? products[0] : null);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleProductChange = (prodId) => {
    const prod = products.find((p) => p._id === prodId);
    setSelectedProductObj(prod || null);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      unitPrice: prod ? prod.price : prev.unitPrice
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.supplierId) errs.supplierId = 'Supplier is required';
    if (!formData.productId) errs.productId = 'Product is required';
    if (!formData.quantity || formData.quantity < 1) errs.quantity = 'Quantity must be at least 1';
    if (formData.unitPrice === '' || isNaN(formData.unitPrice) || formData.unitPrice < 0) {
      errs.unitPrice = 'Enter valid unit price';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        supplierId: formData.supplierId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity, 10),
        unitPrice: parseFloat(formData.unitPrice),
        status: formData.status || 'Completed',
        purchaseDate: formData.purchaseDate
      };
      const res = await purchaseService.create(payload);
      if (res.data.success) {
        showToast('Purchase order saved and product quantity updated!', 'success');
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save purchase', 'error');
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await purchaseService.update(editingPurchase._id, formData);
      showToast('Purchase updated successfully', 'success');
      setEditModalOpen(false);
      fetchData();
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
      await purchaseService.delete(deletingPurchase._id);
      showToast('Purchase record removed', 'success');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Failed to delete purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  const completedCount = purchases.filter((p) => p.status !== 'Pending').length;
  const pendingCount = purchases.filter((p) => p.status === 'Pending').length;
  const totalExpenditure = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

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
          <h1>Purchases</h1>
          <p>Record stock purchase orders and track complete procurement history</p>
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
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-orange-pill" onClick={handleOpenAdd}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row - Exactly matches Dashboard height and geometry */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Purchases"
          subtext="+3 this month"
          subtextColor="green"
          value={purchases.length}
          iconType="purchases"
        />

        <StatCard
          title="Completed Orders"
          subtext="Processed in full"
          subtextColor="green"
          value={completedCount}
          iconType="suppliers"
        />

        <StatCard
          title="Pending Orders"
          subtext="Awaiting delivery"
          subtextColor={pendingCount > 0 ? 'grey' : 'green'}
          value={pendingCount}
          iconType="products"
        />

        <StatCard
          title="Total Outlay"
          subtext="Cumulative expenditure"
          subtextColor="grey"
          value={formatCurrency(totalExpenditure)}
          iconType="expenditure"
        />
      </div>

      {/* Purchases Table Card */}
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
            <span className="header-title-text">All Purchases</span>
          </div>
          <button className="header-dots-btn" onClick={fetchData}>
            •••
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading purchases...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h4 className="empty-title">No purchases recorded</h4>
            <p className="empty-desc">Create a new purchase order to increase product inventory.</p>
            <button className="btn-orange-pill" onClick={handleOpenAdd}>
              + Record Purchase
            </button>
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
                {filtered.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="id-cell">{p.purchaseId || `#P${String(idx + 1).padStart(3, '0')}`}</td>
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
                        <button className="row-icon-btn" title="Edit" onClick={() => handleOpenEdit(p)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="row-icon-btn delete"
                          title="Delete"
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record New Purchase">
        <form onSubmit={handleSubmit}>
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
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Stock: {p.quantity}, Price: ${p.price})
                </option>
              ))}
            </select>
            {formErrors.productId && <div className="form-error">{formErrors.productId}</div>}
          </div>

          {selectedProductObj && (
            <div style={{ backgroundColor: '#F8F9FA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Available: <strong>{selectedProductObj.quantity} units</strong></span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>
                After Purchase: {selectedProductObj.quantity + (parseInt(formData.quantity, 10) || 0)} (+{formData.quantity || 0})
              </span>
            </div>
          )}

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
              {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
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
              {formErrors.unitPrice && <div className="form-error">{formErrors.unitPrice}</div>}
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
              {submitting ? 'Recording...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Purchase">
        <form onSubmit={handleUpdate}>
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
              {submitting ? 'Saving...' : 'Update Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase record?"
        loading={submitting}
      />
    </div>
  );
};

export default Purchases;
