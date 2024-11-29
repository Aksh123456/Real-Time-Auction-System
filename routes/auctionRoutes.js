const express = require('express');
const { getActiveAuctions, createAuction } = require('../controllers/auctionController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', auth, getActiveAuctions);
router.post('/create', createAuction);

module.exports = router;
