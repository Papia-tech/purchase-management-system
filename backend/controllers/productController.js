const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching products', error: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get products with stock at or below low stock threshold
// @route   GET /api/products/low-stock
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold !== undefined ? Number(req.query.threshold) : 10;
    const products = await Product.find({ quantity: { $lte: threshold } }).sort({ quantity: 1 });
    res.status(200).json({
      success: true,
      threshold,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock products',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;

    if (!name || !category || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price are required'
      });
    }

    const numPrice = Number(price);
    const numQty = quantity !== undefined && quantity !== '' ? Number(quantity) : 0;

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number' });
    }

    if (isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid non-negative number' });
    }

    const product = await Product.create({
      name,
      category,
      price: numPrice,
      quantity: numQty
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error while creating product', error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number' });
      }
      updateData.price = numPrice;
    }
    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (isNaN(numQty) || numQty < 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a valid non-negative number' });
      }
      updateData.quantity = numQty;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error while updating product', error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting product', error: error.message });
  }
};

// Helper to parse CSV text
function parseCsvText(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

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

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length === 0 || cols.every((c) => c === '')) continue;
    results.push({
      name: nameIdx !== -1 ? cols[nameIdx] : cols[0],
      category: categoryIdx !== -1 ? cols[categoryIdx] : cols[1],
      price: priceIdx !== -1 ? cols[priceIdx] : cols[2],
      quantity: quantityIdx !== -1 ? cols[quantityIdx] : (cols[3] || 0)
    });
  }
  return results;
}

// @desc    Bulk import products
// @route   POST /api/products/bulk
exports.bulkImportProducts = async (req, res) => {
  try {
    let rawItems = [];

    if (Array.isArray(req.body)) {
      rawItems = req.body;
    } else if (req.body && Array.isArray(req.body.products)) {
      rawItems = req.body.products;
    } else if (typeof req.body === 'string' || (req.body && typeof req.body.csv === 'string')) {
      const csvContent = typeof req.body === 'string' ? req.body : req.body.csv;
      rawItems = parseCsvText(csvContent);
    }

    if (!rawItems || rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products provided for bulk import'
      });
    }

    const validProducts = [];
    const errors = [];

    rawItems.forEach((item, index) => {
      const rowNum = index + 1;
      const name = item.name ? String(item.name).trim() : '';
      const category = item.category ? String(item.category).trim() : '';
      const rawPrice = item.price !== undefined && item.price !== null ? String(item.price).replace(/[$,]/g, '').trim() : '';
      const rawQty = item.quantity !== undefined && item.quantity !== null && item.quantity !== ''
        ? String(item.quantity).replace(/[,]/g, '').trim()
        : '0';

      if (!name) {
        errors.push(`Row ${rowNum}: Product name is required`);
        return;
      }
      if (!category) {
        errors.push(`Row ${rowNum}: Category is required`);
        return;
      }

      const numPrice = Number(rawPrice);
      if (rawPrice === '' || isNaN(numPrice) || numPrice < 0) {
        errors.push(`Row ${rowNum}: Valid non-negative price is required`);
        return;
      }

      const numQty = rawQty === '' ? 0 : Number(rawQty);
      if (isNaN(numQty) || numQty < 0) {
        errors.push(`Row ${rowNum}: Valid non-negative quantity is required`);
        return;
      }

      validProducts.push({
        name,
        category,
        price: numPrice,
        quantity: numQty
      });
    });

    if (validProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products to import',
        errors
      });
    }

    const createdProducts = await Product.insertMany(validProducts);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdProducts.length} product(s)`,
      count: createdProducts.length,
      data: createdProducts,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while importing products',
      error: error.message
    });
  }
};
