const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/', productController.getAllProducts);
router.get('/:productId/stats', productController.getProductStats);
router.get('/:id', productController.getProductById);
router.post('/', authMiddleware, upload.single('image'), productController.createProduct);


module.exports = router;