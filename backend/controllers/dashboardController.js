const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');

// @desc    Get dashboard metrics & recent purchases
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalSuppliers, totalProducts, totalPurchases] = await Promise.all([
      Supplier.countDocuments(),
      Product.countDocuments(),
      Purchase.countDocuments()
    ]);

    // Calculate total expenditure using MongoDB aggregation
    const expenditureResult = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalExpenditure: { $sum: '$totalAmount' },
          totalUnitsPurchased: { $sum: '$quantity' }
        }
      }
    ]);

    const totalExpenditure = expenditureResult.length > 0 ? expenditureResult[0].totalExpenditure : 0;
    const totalUnitsPurchased = expenditureResult.length > 0 ? expenditureResult[0].totalUnitsPurchased : 0;

    // Calculate total available stock across all products
    const stockResult = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$quantity' }
        }
      }
    ]);
    const totalStock = stockResult.length > 0 ? stockResult[0].totalStock : 0;

    // Get 5 most recent purchases
    const recentPurchases = await Purchase.find()
      .populate('supplierId', 'name email phone')
      .populate('productId', 'name category price quantity')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        totalProducts,
        totalPurchases,
        totalExpenditure: Number(totalExpenditure.toFixed(2)),
        totalUnitsPurchased,
        totalStock,
        recentPurchases
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while calculating dashboard statistics',
      error: error.message
    });
  }
};
