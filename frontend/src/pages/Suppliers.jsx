import React, { useState, useEffect } from 'react';
import { supplierService } from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: ''
};

const Suppliers = ({ showToast }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierService.getAll();
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      showToast('Error loading suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingId(s._id);
    setFormData({
      name: s.name,
      email: s.email,
      phone: s.phone,
      address: s.address
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      if (editingId) {
        await supplierService.update(editingId, formData);
        showToast('Supplier updated successfully', 'success');
      } else {
        await supplierService.create(formData);
        showToast('Supplier created successfully', 'success');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    try {
      setSubmitting(true);
      await supplierService.delete(deletingSupplier._id);
      showToast(`Supplier ${deletingSupplier.name} deleted`, 'success');
      setDeleteModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast('Failed to delete supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = suppliers.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Subheader Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-title-area">
          <h1>Suppliers</h1>
          <p>Manage verified vendors and commercial partner details</p>
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
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-orange-pill" onClick={handleOpenAdd}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row - Exactly matches Dashboard height and geometry */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Suppliers"
          subtext="+2 new this month"
          subtextColor="green"
          value={suppliers.length}
          iconType="suppliers"
        />

        <StatCard
          title="Active Vendors"
          subtext="Verified partners"
          subtextColor="green"
          value={suppliers.length}
          iconType="products"
        />

        <StatCard
          title="Contact Rate"
          subtext="100% email verified"
          subtextColor="green"
          value="100%"
          iconType="purchases"
        />

        <StatCard
          title="Supply Hubs"
          subtext="Regional coverage"
          subtextColor="grey"
          value={`${suppliers.length} Hubs`}
          iconType="expenditure"
        />
      </div>

      {/* Suppliers Table Card */}
      <div className="invento-table-card">
        <div className="table-card-header">
          <div className="header-left-title">
            <span className="header-icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            <span className="header-title-text">Supplier Directory</span>
          </div>
          <button className="header-dots-btn" onClick={fetchSuppliers}>
            •••
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading suppliers from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4 className="empty-title">No suppliers found</h4>
            <p className="empty-desc">Get started by creating your first vendor partner.</p>
            <button className="btn-orange-pill" onClick={handleOpenAdd}>
              + Add Supplier
            </button>
          </div>
        ) : (
          <div className="table-responsive-box">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s._id}>
                    <td className="id-cell">#S{String(idx + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>{s.address}</td>
                    <td>
                      <div className="action-buttons-wrap" style={{ justifyContent: 'center' }}>
                        <button className="row-icon-btn" title="Edit" onClick={() => handleOpenEdit(s)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="row-icon-btn delete"
                          title="Delete"
                          onClick={() => {
                            setDeletingSupplier(s);
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

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Supplier' : 'Add New Supplier'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Supplier Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. ABC Electronics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="sales@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <div className="form-error">{formErrors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="Headquarters or warehouse address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            {formErrors.address && <div className="form-error">{formErrors.address}</div>}
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-orange-pill" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deletingSupplier?.name}"?`}
        loading={submitting}
      />
    </div>
  );
};

export default Suppliers;
