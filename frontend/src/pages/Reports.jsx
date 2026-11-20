import React, { useState, useEffect } from 'react';
import { purchaseService, productService, supplierService } from '../services/api';
import StatCard from '../components/StatCard';

const Reports = ({ showToast }) => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportScope, setReportScope] = useState('all');
  const [generatedAt, setGeneratedAt] = useState(() => new Date());

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [purRes, prodRes, suppRes] = await Promise.all([
        purchaseService.getAll(),
        productService.getAll(),
        supplierService.getAll()
      ]);
      if (purRes.data.success) setPurchases(purRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (suppRes.data.success) setSuppliers(suppRes.data.data);
      setGeneratedAt(new Date());
    } catch {
      showToast?.('Error generating reports', 'error');
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

  // -------------------------------------------------------------
  // Comprehensive Analytical Calculations
  // -------------------------------------------------------------
  const totalExpenditure = purchases.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const totalUnitsPurchased = purchases.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const avgOrder = purchases.length > 0 ? totalExpenditure / purchases.length : 0;
  const completedPurchases = purchases.filter((p) => (p.status || '').toLowerCase() === 'completed').length;
  const fulfillmentRate = purchases.length > 0 ? Math.round((completedPurchases / purchases.length) * 100) : 100;
  const lowStockItems = products.filter((p) => p.quantity <= 10);

  // Category Analysis (Spending, Inventory Valuation, Stock)
  const allCategories = [
    ...new Set([
      ...products.map((p) => p.category).filter(Boolean),
      ...purchases.map((p) => p.productId?.category).filter(Boolean)
    ])
  ];

  const categoryAnalysis = allCategories.map((cat) => {
    const catProducts = products.filter((p) => p.category === cat);
    const catPurchases = purchases.filter(
      (p) => p.productId?.category === cat || (!p.productId && catProducts.some((cp) => cp.name === p.productId?.name))
    );

    const stockCount = catProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const inventoryVal = catProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
    const spendAmount = catPurchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const spendPercent = totalExpenditure > 0 ? ((spendAmount / totalExpenditure) * 100).toFixed(1) : '0';

    return {
      category: cat,
      itemCount: catProducts.length,
      stockCount,
      inventoryVal,
      spendAmount,
      spendPercent: Number(spendPercent)
    };
  }).sort((a, b) => b.spendAmount - a.spendAmount);

  // Supplier Procurement & Performance Analysis
  const supplierAnalysis = suppliers.map((s) => {
    const suppPurchases = purchases.filter((p) => p.supplierId?._id === s._id || p.supplierId?.name === s.name);
    const totalSpent = suppPurchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const totalUnits = suppPurchases.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const completedCount = suppPurchases.filter((p) => (p.status || '').toLowerCase() === 'completed').length;
    const fulfillment = suppPurchases.length > 0 ? Math.round((completedCount / suppPurchases.length) * 100) : 100;
    const sortedDates = [...suppPurchases].sort(
      (a, b) => new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt)
    );
    const lastOrder = sortedDates[0];

    return {
      id: s._id,
      name: s.name,
      email: s.email,
      ordersCount: suppPurchases.length,
      totalSpent,
      totalUnits,
      fulfillment,
      lastOrderDate: lastOrder ? (lastOrder.purchaseDate || lastOrder.createdAt) : null
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Filtered Purchases for Ledger List
  const filteredPurchases = purchases.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const pid = (p.purchaseId || p._id || '').toLowerCase();
    const supp = (p.supplierId?.name || '').toLowerCase();
    const prod = (p.productId?.name || '').toLowerCase();
    const cat = (p.productId?.category || '').toLowerCase();
    return pid.includes(q) || supp.includes(q) || prod.includes(q) || cat.includes(q);
  });

  // Filtered Products for Inventory List
  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  // -------------------------------------------------------------
  // Export Full CSV Report (Multi-section analysis + list)
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '========================================================================\r\n';
    csv += 'INVENTO ENTERPRISE PURCHASE & INVENTORY MANAGEMENT SYSTEM\r\n';
    csv += 'FULL PROCUREMENT AUDIT & INVENTORY ANALYSIS REPORT\r\n';
    csv += `Generated On: ${generatedAt.toLocaleString()}\r\n`;
    csv += `Scope: ${reportScope === 'all' ? 'Full Comprehensive Report' : reportScope.toUpperCase()}\r\n`;
    csv += '========================================================================\r\n\r\n';

    // Section 1: Executive KPI Summary
    csv += '1. EXECUTIVE FINANCIAL & INVENTORY SUMMARY\r\n';
    csv += 'Metric,Value\r\n';
    csv += `Total Procurement Expenditure,"${formatCurrency(totalExpenditure)}"\r\n`;
    csv += `Total Current Inventory Value,"${formatCurrency(totalInventoryValue)}"\r\n`;
    csv += `Average Order Value,"${formatCurrency(avgOrder)}"\r\n`;
    csv += `Total Purchase Orders,${purchases.length}\r\n`;
    csv += `Total Units Procured,${totalUnitsPurchased}\r\n`;
    csv += `Total Available Stock Units,${totalStockUnits}\r\n`;
    csv += `Order Fulfillment Rate,${fulfillmentRate}%\r\n`;
    csv += `Low Stock Alert Items,${lowStockItems.length}\r\n\r\n`;

    // Section 2: Category Analysis
    csv += '2. CATEGORY SPENDING & INVENTORY BREAKDOWN\r\n';
    csv += 'Category,Item Count,Stock Units,Inventory Value,Total Spend,Spend Share (%)\r\n';
    categoryAnalysis.forEach((c) => {
      csv += `"${c.category}",${c.itemCount},${c.stockCount},"${formatCurrency(c.inventoryVal)}","${formatCurrency(c.spendAmount)}",${c.spendPercent}%\r\n`;
    });
    csv += '\r\n';

    // Section 3: Supplier Analysis
    csv += '3. SUPPLIER PROCUREMENT & PERFORMANCE BREAKDOWN\r\n';
    csv += 'Supplier Name,Email,Orders Placed,Total Spend,Units Supplied,Fulfillment Rate\r\n';
    supplierAnalysis.forEach((s) => {
      csv += `"${s.name}","${s.email || 'N/A'}",${s.ordersCount},"${formatCurrency(s.totalSpent)}",${s.totalUnits},${s.fulfillment}%\r\n`;
    });
    csv += '\r\n';

    // Section 4: Critical Low Stock Items
    if (lowStockItems.length > 0) {
      csv += '4. CRITICAL LOW STOCK & REORDER ADVISORY\r\n';
      csv += 'Product Name,Category,Current Stock,Price,Status\r\n';
      lowStockItems.forEach((p) => {
        csv += `"${p.name}","${p.category}",${p.quantity},"${formatCurrency(p.price)}","${p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}"\r\n`;
      });
      csv += '\r\n';
    }

    // Section 5: Itemized Transaction Ledger
    csv += '5. ITEMIZED PROCUREMENT TRANSACTION AUDIT LEDGER\r\n';
    csv += 'PO Number,Supplier,Product,Category,Quantity,Unit Price,Total Amount,Date,Status\r\n';
    filteredPurchases.forEach((p, idx) => {
      const pid = p.purchaseId || `#P${String(idx + 1).padStart(3, '0')}`;
      const supp = p.supplierId?.name || 'Deleted Supplier';
      const prod = p.productId?.name || 'Deleted Product';
      const cat = p.productId?.category || 'General';
      const qty = p.quantity;
      const unit = formatCurrency(p.unitPrice);
      const total = formatCurrency(p.totalAmount);
      const date = formatDate(p.purchaseDate);
      const status = p.status || 'Completed';
      csv += `"${pid}","${supp}","${prod}","${cat}",${qty},"${unit}","${total}","${date}","${status}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invento_full_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.('Full audit report generated & downloaded as CSV!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* -----------------------------------------------------------
          PRINT-ONLY OFFICIAL HEADER (Rendered only on Print / PDF)
          ----------------------------------------------------------- */}
      <div className="print-only-header">
        <div className="print-header-top">
          <div>
            <div className="print-header-title">INVENTO ENTERPRISE</div>
            <div className="print-header-sub">Purchase & Inventory Management System • Audit Analysis Report</div>
          </div>
          <div className="print-header-meta">
            <div><strong>Generated:</strong> {generatedAt.toLocaleString()}</div>
            <div><strong>Scope:</strong> {reportScope === 'all' ? 'Full Comprehensive Audit' : reportScope.toUpperCase()}</div>
            <div><strong>Status:</strong> System Verified</div>
          </div>
        </div>
      </div>

      {/* Subheader Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-title-area">
          <h1>Reports & Analysis</h1>
          <p>Comprehensive procurement intelligence, inventory valuation, and transaction audit log</p>
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
              placeholder="Search in report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Scope Selector */}
          <select
            className="dropdown-pill-btn"
            value={reportScope}
            onChange={(e) => setReportScope(e.target.value)}
            title="Filter report view scope"
          >
            <option value="all">Full Comprehensive Report</option>
            <option value="procurement">Procurement & Spend</option>
            <option value="inventory">Inventory & Valuation</option>
            <option value="suppliers">Supplier Performance</option>
          </select>

          {/* Export Full CSV Report Button */}
          <button className="dropdown-pill-btn" onClick={handleExportCSV} title="Export full report with analysis as CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>

          {/* Print / Save PDF Button */}
          <button className="dropdown-pill-btn" onClick={handlePrint} title="Print or save as PDF report">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print / PDF</span>
          </button>

          {/* Sync Live Data Button */}
          <button className="btn-orange-pill" onClick={fetchReports}>
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Expenditure"
          subtext={`Across ${purchases.length} purchase orders`}
          subtextColor="grey"
          value={formatCurrency(totalExpenditure)}
          iconType="expenditure"
        />

        <StatCard
          title="Inventory Valuation"
          subtext={`${totalStockUnits} total units in stock`}
          subtextColor="green"
          value={formatCurrency(totalInventoryValue)}
          iconType="products"
        />

        <StatCard
          title="Average Order Value"
          subtext={`${fulfillmentRate}% orders fulfilled`}
          subtextColor="green"
          value={formatCurrency(avgOrder)}
          iconType="suppliers"
        />

        <StatCard
          title="Units Procured"
          subtext={lowStockItems.length > 0 ? `${lowStockItems.length} items low stock` : 'Stock health optimal'}
          subtextColor={lowStockItems.length > 0 ? 'orange' : 'green'}
          value={totalUnitsPurchased}
          iconType="purchases"
        />
      </div>

      {loading ? (
        <div className="invento-table-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
          <span style={{ color: 'var(--color-text-sub)', fontSize: '14px' }}>Compiling full report analysis and transaction ledger...</span>
        </div>
      ) : (
        <>
          {/* -----------------------------------------------------------
              REPORT ANALYSIS SECTION: Category & Supplier Breakdowns
              ----------------------------------------------------------- */}
          {(reportScope === 'all' || reportScope === 'procurement' || reportScope === 'inventory' || reportScope === 'suppliers') && (
            <div className="report-analysis-grid">
              {/* Category Spending & Stock Breakdown */}
              {(reportScope === 'all' || reportScope === 'procurement' || reportScope === 'inventory') && (
                <div className="invento-table-card" style={{ marginBottom: 0 }}>
                  <div className="table-card-header">
                    <div className="header-left-title">
                      <span className="header-icon-orange">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      </span>
                      <span className="header-title-text">Category Spend & Inventory Valuation</span>
                    </div>
                  </div>
                  <div className="table-responsive-box">
                    <table className="mini-analysis-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Products</th>
                          <th>Stock Units</th>
                          <th>Inventory Value</th>
                          <th>Total Spent</th>
                          <th style={{ width: '90px' }}>Budget Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAnalysis.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No categories recorded</td>
                          </tr>
                        ) : (
                          categoryAnalysis.map((c) => (
                            <tr key={c.category}>
                              <td style={{ fontWeight: 600 }}>{c.category}</td>
                              <td>{c.itemCount} items</td>
                              <td>{c.stockCount} units</td>
                              <td style={{ fontWeight: 600 }}>{formatCurrency(c.inventoryVal)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{formatCurrency(c.spendAmount)}</td>
                              <td>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#555', marginBottom: '2px' }}>{c.spendPercent}%</div>
                                <div className="progress-bar-bg">
                                  <div className="progress-bar-fill" style={{ width: `${Math.min(c.spendPercent, 100)}%` }}></div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Supplier Procurement & Performance Breakdown */}
              {(reportScope === 'all' || reportScope === 'procurement' || reportScope === 'suppliers') && (
                <div className="invento-table-card" style={{ marginBottom: 0 }}>
                  <div className="table-card-header">
                    <div className="header-left-title">
                      <span className="header-icon-orange">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </span>
                      <span className="header-title-text">Supplier Spend & Procurement Performance</span>
                    </div>
                  </div>
                  <div className="table-responsive-box">
                    <table className="mini-analysis-table">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Orders</th>
                          <th>Units Procured</th>
                          <th>Total Spent</th>
                          <th>Fulfillment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierAnalysis.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No suppliers recorded</td>
                          </tr>
                        ) : (
                          supplierAnalysis.slice(0, 6).map((s) => (
                            <tr key={s.id || s.name}>
                              <td style={{ fontWeight: 600 }}>
                                <div>{s.name}</div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>{s.email || '—'}</div>
                              </td>
                              <td>{s.ordersCount} orders</td>
                              <td>{s.totalUnits} units</td>
                              <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{formatCurrency(s.totalSpent)}</td>
                              <td>
                                <span className="status-pill in-stock" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                  {s.fulfillment}% Done
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Critical Low Stock Alert Card (if items are low stock) */}
          {lowStockItems.length > 0 && (reportScope === 'all' || reportScope === 'inventory') && (
            <div className="invento-table-card" style={{ marginBottom: '24px', borderLeft: '4px solid #F97316' }}>
              <div className="table-card-header">
                <div className="header-left-title">
                  <span className="header-icon-orange" style={{ color: '#F97316' }}>
                    ⚠️
                  </span>
                  <span className="header-title-text">Critical Inventory Reorder Advisory ({lowStockItems.length} Products Needing Attention)</span>
                </div>
              </div>
              <div className="table-responsive-box">
                <table className="mini-analysis-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Current Available Stock</th>
                      <th>Unit Price</th>
                      <th>Status Advisory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td style={{ fontWeight: 700, color: p.quantity === 0 ? '#DC2626' : '#D97706' }}>
                          {p.quantity} units
                        </td>
                        <td>{formatCurrency(p.price)}</td>
                        <td>
                          <span className={`status-pill ${p.quantity === 0 ? 'out-of-stock' : 'low-stock'}`}>
                            {p.quantity === 0 ? 'Out of Stock - Urgent Restock' : 'Low Stock - Reorder Soon'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              INVENTORY CATALOG LIST (When viewing Inventory scope)
              ----------------------------------------------------------- */}
          {reportScope === 'inventory' && (
            <div className="invento-table-card" style={{ marginBottom: '24px' }}>
              <div className="table-card-header">
                <div className="header-left-title">
                  <span className="header-icon-orange">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                    </svg>
                  </span>
                  <span className="header-title-text">Complete Product Inventory Valuation List ({filteredProducts.length} Items)</span>
                </div>
              </div>
              <div className="table-responsive-box">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Stock Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Inventory Valuation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.quantity} units</td>
                        <td>{formatCurrency(p.price)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>
                          {formatCurrency(p.price * p.quantity)}
                        </td>
                        <td>
                          <span className={`status-pill ${p.quantity > 10 ? 'in-stock' : p.quantity > 0 ? 'low-stock' : 'out-of-stock'}`}>
                            {p.quantity > 10 ? 'In Stock' : p.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              ITEMIZED PROCUREMENT & TRANSACTION AUDIT LEDGER
              ----------------------------------------------------------- */}
          {(reportScope === 'all' || reportScope === 'procurement' || reportScope === 'suppliers') && (
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
                  <span className="header-title-text">
                    Itemized Procurement & Transaction Audit Ledger ({filteredPurchases.length} Records)
                  </span>
                </div>
                <button className="header-dots-btn" onClick={fetchReports} title="Refresh records">
                  •••
                </button>
              </div>

              {filteredPurchases.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h4 className="empty-title">No transactions match your search</h4>
                  <p className="empty-desc">Try clearing your search query or sync live data.</p>
                </div>
              ) : (
                <div className="table-responsive-box">
                  <table className="recent-table">
                    <thead>
                      <tr>
                        <th>PO #</th>
                        <th>Supplier</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Amount</th>
                        <th>Purchase Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((p, idx) => (
                        <tr key={p._id}>
                          <td className="id-cell">{p.purchaseId || `#P${String(idx + 1).padStart(3, '0')}`}</td>
                          <td style={{ fontWeight: 500 }}>{p.supplierId?.name || 'Deleted Supplier'}</td>
                          <td style={{ fontWeight: 600 }}>{p.productId?.name || 'Deleted Product'}</td>
                          <td style={{ color: 'var(--color-text-sub)' }}>{p.productId?.category || 'Footwear'}</td>
                          <td>{p.quantity} units</td>
                          <td>{formatCurrency(p.unitPrice)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>
                            {formatCurrency(p.totalAmount)}
                          </td>
                          <td>{formatDate(p.purchaseDate || p.createdAt)}</td>
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
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
