const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts
} = require('../controllers/productController');

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.post('/bulk', bulkImportProducts);
router.post('/bulk-import', bulkImportProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
