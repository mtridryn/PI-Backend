const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { addActivityToLatestBooking } = require('../controllers/bookingActivityController');

router.post('/activities', authMiddleware, addActivityToLatestBooking);

module.exports = router;
