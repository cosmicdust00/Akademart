const express = require('express');
const router = express.Router();

const interactionController = require('../controllers/interaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Endpoint ini diam-diam dipanggil oleh frontend saat user membuka halaman detail produk
router.post('/view', authMiddleware, interactionController.viewProduct);

router.post('/buy', authMiddleware, interactionController.buyProduct);
router.post('/like', authMiddleware, interactionController.likeProduct);
router.post('/dislike', authMiddleware, interactionController.dislikeProduct);
router.post('/remove', authMiddleware, interactionController.removeInteraction);

module.exports = router;