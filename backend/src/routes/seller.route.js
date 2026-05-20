const express = require('express');
const router = express.Router();

const sellerController = require('../controllers/seller.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/orders/confirm', authMiddleware, sellerController.confirmSale);
router.post('/orders/cancel', authMiddleware, sellerController.cancelSale);
router.patch('/products/:productId/stock', authMiddleware, sellerController.updateStock);
router.get('/products', authMiddleware, sellerController.getMyProducts);
router.delete('/products/:productId', authMiddleware, sellerController.deleteProduct);

module.exports = router;