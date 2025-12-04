const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  paginationValidator,
  createProductValidator,
  updateProductValidator
} = require('../validators/productValidators');

router.get('/', paginationValidator, validate, productController.getProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

router.post('/', protect, admin, createProductValidator, validate, productController.createProduct);
router.put('/:id', protect, admin, updateProductValidator, validate, productController.updateProduct);
router.delete('/:id', protect, admin, productController.deleteProduct);

module.exports = router;
