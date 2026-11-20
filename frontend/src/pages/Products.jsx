import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import BulkImportModal from '../components/BulkImportModal';

const initialForm = {
  name: '',
  category: '',
  price: '',
  quantity: ''
};

const Products = ({ showToast }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState(() => (searchParams.get('filter') === 'low-stock' ? 'low-stock' : 'all'));

  useEffect(() => {
    if (searchParams.get('filter') === 'low-stock') {
      setStockFilter('low-stock');
    }
  }, [searchParams]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Bulk Import state
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll();
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      showToast('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      errs.price = 'Enter a valid price';
    }
    if (formData.quantity === '' || isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      errs.quantity = 'Enter a valid quantity';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p._id);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      quantity: p.quantity
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };

      if (editingId) {
        await productService.update(editingId, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await productService.create(payload);
        showToast('Product created successfully', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      setSubmitting(true);
      await productService.delete(deletingProduct._id);
      showToast(`Product ${deletingProduct.name} deleted`, 'success');
      setDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast('Failed to delete product', 'error');
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

  const getStockPill = (qty) => {
    if (qty > 10) {
      return <span className="status-pill in-stock">In Stock</span>;
    } else if (qty > 0) {
      return <span className="status-pill low-stock">Low Stock</span>;
    } else {
      return <span className="status-pill out-of-stock">Out of Stock</span>;
    }
  };

  const inStockCount = products.filter((p) => p.quantity > 10).length;
  const lowStockCount = products.filter((p) => p.quantity <= 10).length;
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low-stock'
        ? p.quantity <= 10
        : stockFilter === 'out-of-stock'
        ? p.quantity === 0
        : stockFilter === 'in-stock'
        ? p.quantity > 10
        : true;

    if (!searchTerm) return matchesCat && matchesStock;
    const q = searchTerm.toLowerCase();
    return matchesCat && matchesStock && (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  });

  return (
    <div className="page-container">
      {/* Subheader Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-title-area">
          <h1>Products</h1>
          <p>Maintain your product catalog, prices, and available stock levels</p>
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="dropdown-pill-btn"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            className="dropdown-pill-btn"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              if (e.target.value !== 'low-stock' && searchParams.get('filter') === 'low-stock') {
                setSearchParams({});
              }
            }}
            title="Filter by stock inventory health"
          >
            <option value="all">All Stock Status</option>
            <option value="low-stock">⚠️ Low Stock (≤ 10)</option>
            <option value="out-of-stock">🚫 Out of Stock (0)</option>
            <option value="in-stock">✓ In Stock (&gt; 10)</option>
          </select>

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

          <button className="btn-orange-pill" onClick={handleOpenAdd}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row - Exactly matches Dashboard height and geometry */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Products"
          subtext="+5 new this month"
          subtextColor="green"
          value={products.length}
          iconType="products"
        />

        <StatCard
          title="In Stock Items"
          subtext="Healthy inventory"
          subtextColor="green"
          value={inStockCount}
          iconType="suppliers"
        />

        <div
          onClick={() => {
            const next = stockFilter === 'low-stock' ? 'all' : 'low-stock';
            setStockFilter(next);
            if (next === 'all') setSearchParams({});
          }}
          style={{ cursor: 'pointer' }}
          title="Click to toggle low stock filter"
        >
          <StatCard
            title="Low Stock Alert"
            subtext={stockFilter === 'low-stock' ? 'Filter active (Click to reset)' : lowStockCount > 0 ? 'Click to view alerts' : 'Stock level optimal'}
            subtextColor={lowStockCount > 0 ? 'orange' : 'green'}
            value={lowStockCount}
            iconType="purchases"
          />
        </div>

        <StatCard
          title="Categories"
          subtext="Product groups"
          subtextColor="grey"
          value={categories.length - 1}
          iconType="expenditure"
        />
      </div>

      {/* Low Stock Alert Notification Banner */}
      {lowStockCount > 0 && (
        <div className="low-stock-alert-banner">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Low Stock Alert:</strong> {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} at or below reorder threshold (≤ 10 units).
            </div>
          </div>
          <button
            className="alert-action-btn"
            onClick={() => {
              const next = stockFilter === 'low-stock' ? 'all' : 'low-stock';
              setStockFilter(next);
              if (next === 'all') setSearchParams({});
            }}
          >
            {stockFilter === 'low-stock' ? 'Show All Products' : `View ${lowStockCount} Low Stock Item${lowStockCount > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="invento-table-card">
        <div className="table-card-header">
          <div className="header-left-title">
            <span className="header-icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="M12 22V12"></path>
              </svg>
            </span>
            <span className="header-title-text">Product Inventory</span>
          </div>
          <button className="header-dots-btn" onClick={fetchProducts}>
            •••
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading product catalog...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h4 className="empty-title">No products found</h4>
            <p className="empty-desc">Create your first product in the inventory database.</p>
            <button className="btn-orange-pill" onClick={handleOpenAdd}>
              + Add Product
            </button>
          </div>
        ) : (
          <div className="table-responsive-box">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="id-cell">#PR{String(idx + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.quantity} units</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td>{getStockPill(p.quantity)}</td>
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
                            setDeletingProduct(p);
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Laptop"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Category <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Computers, Accessories, Displays"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            {formErrors.category && <div className="form-error">{formErrors.category}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price ($) <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              {formErrors.price && <div className="form-error">{formErrors.price}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Initial Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Available stock"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-orange-pill" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}"?`}
        loading={submitting}
      />

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchProducts}
        showToast={showToast}
      />
    </div>
  );
};

export default Products;
