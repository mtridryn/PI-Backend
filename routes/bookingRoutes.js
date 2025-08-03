const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getBookingById
} = require('../controllers/bookingController');

// Buat booking baru
router.post('/', authMiddleware, createBooking);

// Get semua booking user
router.get('/', authMiddleware, getUserBookings);

// Get detail booking berdasarkan ID
router.get('/:bookingId', authMiddleware, getBookingById);

module.exports = router;
