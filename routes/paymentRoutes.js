const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createSnapTransaction, handleNotification } = require('../controllers/paymentController');

router.post('/create-snap', authMiddleware, createSnapTransaction);
// Endpoint untuk menerima notifikasi dari Midtrans
router.post('/notification', handleNotification);

module.exports = router;
