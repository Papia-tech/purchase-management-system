import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { productService } from '../services/api';

const BulkImportModal = ({ isOpen, onClose, onSuccess, showToast }) => {
  const [importFile, setImportFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    if (!text || typeof text !== 'string') return { products: [], errors: [] };
    const clean = text.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { products: [], errors: ['CSV file is empty or missing data rows'] };
    }

    const parseRow = (line) => {
      const row = [];
      let insideQuotes = false;
      let entry = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            entry += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      return row;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const getIndex = (aliases) => headers.findIndex((h) => aliases.includes(h));

    const nameIdx = getIndex(['name', 'productname', 'product', 'item', 'title']);
    const categoryIdx = getIndex(['category', 'categoryname', 'type', 'group']);
    const priceIdx = getIndex(['price', 'unitprice', 'cost', 'rate']);
    const quantityIdx = getIndex(['quantity', 'qty', 'stock', 'stockquantity', 'inventory', 'units']);

    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const cols = parseRow(lines[i]);
      if (cols.length === 0 || cols.every((c) => c === '')) continue;

      const rawName = nameIdx !== -1 ? cols[nameIdx] : cols[0];
      const rawCategory = categoryIdx !== -1 ? cols[categoryIdx] : cols[1];
      const rawPrice = priceIdx !== -1 ? cols[priceIdx] : cols[2];
      const rawQty = quantityIdx !== -1 ? cols[quantityIdx] : (cols[3] || '0');

      const name = rawName ? String(rawName).trim() : '';
      const category = rawCategory ? String(rawCategory).trim() : '';
      const cleanPriceStr = rawPrice !== undefined && rawPrice !== null ? String(rawPrice).replace(/[$,]/g, '').trim() : '';
      const cleanQtyStr = rawQty !== undefined && rawQty !== null && rawQty !== '' ? String(rawQty).replace(/[,]/g, '').trim() : '0';

      if (!name) {
        errors.push(`Row ${rowNum}: Product name is missing`);
        continue;
      }
      if (!category) {
        errors.push(`Row ${rowNum}: Category is missing for "${name}"`);
        continue;
      }

      const price = Number(cleanPriceStr);
      if (cleanPriceStr === '' || isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Invalid price for "${name}" (must be a non-negative number)`);
        continue;
      }

      const quantity = cleanQtyStr === '' ? 0 : Number(cleanQtyStr);
      if (isNaN(quantity) || quantity < 0) {
        errors.push(`Row ${rowNum}: Invalid quantity for "${name}" (must be a non-negative number)`);
        continue;
      }

      products.push({ name, category, price, quantity });
    }

    return { products, errors };
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      showToast?.('Please upload a valid .csv file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { products: parsed, errors } = parseCSV(text);
      setImportFile(file);
      setParsedProducts(parsed);
      setParseErrors(errors);
      if (parsed.length === 0 && errors.length > 0) {
        showToast?.('No valid products found in CSV', 'error');
      }
    };
    reader.onerror = () => {
      showToast?.('Failed to read CSV file', 'error');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setParsedProducts([]);
    setParseErrors([]);
    setIsImporting(false);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose?.();
  };

  const handleExecuteImport = async () => {
    if (parsedProducts.length === 0) return;
    try {
      setIsImporting(true);
      const res = await productService.bulkImport(parsedProducts);
      if (res.data.success) {
        showToast?.(`Successfully imported ${res.data.count || parsedProducts.length} product(s)!`, 'success');
        handleClose();
        onSuccess?.();
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to import products', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Products" maxWidth="560px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>
          Upload a CSV with columns: <strong>name, category, price, quantity</strong>
        </span>
        <a
          href="/sample_products.csv"
          download="sample_products.csv"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: 'var(--color-orange)',
            fontWeight: 600,
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFF5F1'
          }}
          title="Download sample CSV file"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Sample CSV
        </a>
      </div>

      {!importFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragActive ? '2px dashed var(--color-orange)' : '2px dashed #E2E2E2',
            backgroundColor: dragActive ? '#FFF5F1' : '#FAFAFA',
            borderRadius: '10px',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
            }}
            style={{ display: 'none' }}
          />
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FFF3EB',
            color: '#FF5A2B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#222', marginBottom: '4px' }}>
            Click to select or drag & drop CSV file
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            CSV files only (.csv) • Up to 5MB
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #EAEAEA',
            backgroundColor: '#F9F9FA',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#FFF3EB',
                color: '#FF5A2B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {importFile.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#888' }}>
                  {(importFile.size / 1024).toFixed(1)} KB • {parsedProducts.length} valid product{parsedProducts.length === 1 ? '' : 's'} found
                </div>
              </div>
            </div>
            <button
              type="button"
              className="row-icon-btn"
              title="Remove file"
              onClick={() => {
                setImportFile(null);
                setParsedProducts([]);
                setParseErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              ✕
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#92400E',
              marginBottom: '14px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                Notice: {parseErrors.length} row(s) skipped:
              </div>
              <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
                {parseErrors.slice(0, 3).map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
                {parseErrors.length > 3 && <div>... and {parseErrors.length - 3} more.</div>}
              </div>
            </div>
          )}

          {parsedProducts.length > 0 && (
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Preview ({Math.min(parsedProducts.length, 5)} of {parsedProducts.length} products):</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Ready</span>
              </div>
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #EAEAEA',
                borderRadius: '8px'
              }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8F8F8', borderBottom: '1px solid #EAEAEA', color: '#666' }}>
                      <th style={{ padding: '8px 10px' }}>Name</th>
                      <th style={{ padding: '8px 10px' }}>Category</th>
                      <th style={{ padding: '8px 10px' }}>Price</th>
                      <th style={{ padding: '8px 10px' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 5).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < 4 ? '1px solid #F0F0F0' : 'none' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '7px 10px', color: '#666' }}>{p.category}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>${p.price}</td>
                        <td style={{ padding: '7px 10px' }}>{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedProducts.length > 5 && (
                <div style={{ fontSize: '11.5px', color: '#888', marginTop: '6px', textAlign: 'right' }}>
                  + {parsedProducts.length - 5} additional products will be imported
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
        <button type="button" className="btn btn-outline" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-orange-pill"
          disabled={isImporting || parsedProducts.length === 0}
          onClick={handleExecuteImport}
        >
          {isImporting ? 'Importing...' : `Import ${parsedProducts.length} Product${parsedProducts.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </Modal>
  );
};

export default BulkImportModal;
