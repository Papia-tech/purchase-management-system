const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: String,
      trim: true
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be non-negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be non-negative']
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending'],
      default: 'Completed'
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      required: [true, 'Purchase date is required']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
