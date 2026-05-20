const express = require('express');
const router = express.Router();

const recomController = require('../controllers/recom.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/recom
router.get('/', authMiddleware, recomController.getRecommendations);

module.exports = router;