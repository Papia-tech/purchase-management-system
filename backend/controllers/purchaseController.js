const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @desc    Get all purchases (history)
// @route   GET /api/purchases
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplierId', 'name email phone address')
      .populate('productId', 'name category price quantity')
      .sort({ purchaseDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching purchases', error: error.message });
  }
};

// @desc    Create new purchase record and increment product stock
// @route   POST /api/purchases
exports.createPurchase = async (req, res) => {
  try {
    const { supplierId, productId, quantity, unitPrice, purchaseDate, status, purchaseId } = req.body;

    // 1. Validate required fields
    if (!supplierId || !productId || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Supplier, Product, Quantity, and Unit Price are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // 2. Validate numeric inputs
    const numQty = parseInt(quantity, 10);
    const numPrice = parseFloat(unitPrice);

    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer of at least 1' });
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a valid non-negative number' });
    }

    // 3. Find supplier and product
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Selected supplier does not exist' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Selected product does not exist' });
    }

    // 4. Calculate total amount on the server
    const totalAmount = Number((numQty * numPrice).toFixed(2));
    const pDate = purchaseDate ? new Date(purchaseDate) : new Date();

    // Auto-generate purchase ID if not provided (e.g. #P001, #P002...)
    let pCustomId = purchaseId;
    if (!pCustomId) {
      const count = await Purchase.countDocuments();
      pCustomId = `#P${String(count + 1).padStart(3, '0')}`;
    }

    // 5. Create the purchase record
    const purchase = await Purchase.create({
      purchaseId: pCustomId,
      supplierId,
      productId,
      quantity: numQty,
      unitPrice: numPrice,
      totalAmount,
      status: status || 'Completed',
      purchaseDate: pDate
    });

    // 6. Increase the product quantity by purchased quantity
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: numQty } },
        { new: true }
      );

      const populatedPurchase = await Purchase.findById(purchase._id)
        .populate('supplierId', 'name email phone')
        .populate('productId', 'name category price quantity');

      return res.status(201).json({
        success: true,
        message: `Purchase created successfully. Product stock increased by ${numQty}.`,
        data: {
          purchase: populatedPurchase,
          updatedProduct
        }
      });
    } catch (stockError) {
      await Purchase.findByIdAndDelete(purchase._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to update product stock. Purchase rolled back.',
        error: stockError.message
      });
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error while creating purchase', error: error.message });
  }
};

// @desc    Update purchase
// @route   PUT /api/purchases/:id
exports.updatePurchase = async (req, res) => {
  try {
    const { status, quantity, unitPrice, purchaseDate } = req.body;
    let purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (purchaseDate) updateFields.purchaseDate = new Date(purchaseDate);
    if (quantity !== undefined || unitPrice !== undefined) {
      const newQty = quantity !== undefined ? parseInt(quantity, 10) : purchase.quantity;
      const newPrice = unitPrice !== undefined ? parseFloat(unitPrice) : purchase.unitPrice;
      updateFields.quantity = newQty;
      updateFields.unitPrice = newPrice;
      updateFields.totalAmount = Number((newQty * newPrice).toFixed(2));
    }

    purchase = await Purchase.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    })
      .populate('supplierId', 'name email phone')
      .populate('productId', 'name category price quantity');

    res.status(200).json({ success: true, message: 'Purchase updated successfully', data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating purchase', error: error.message });
  }
};

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Purchase deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting purchase', error: error.message });
  }
};
