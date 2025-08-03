const pb = require('../pocketbase/pbClient');
const { generateActivityCode, getNextActivitySequence } = require('../utils/idGenerator');

/**
 * Tambahkan aktivitas ke booking terakhir milik user login
 */
exports.addActivityToLatestBooking = async (req, res) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ message: 'Minimal satu aktivitas harus dikirim' });
    }

    const bookings = await pb.collection('booking_uab').getList(1, 1, {
      filter: `user_id = "${req.user.id}"`,
      sort: '-created'
    });

    if (bookings.items.length === 0) {
      return res.status(404).json({ message: 'Tidak ada booking ditemukan' });
    }

    const booking = bookings.items[0];
    const created = [];

    for (const item of activities) {
      const { activity, qty } = item;

      if (!activity || !qty || qty <= 0) continue;

      const sequence = await getNextActivitySequence(pb, booking.id); // <== gunakan id sistem
      const code = generateActivityCode(sequence);

      const result = await pb.collection('booking_activities').create({
        booking_id: booking.id,
        activity,
        qty,
        code_activity: code,
      });

      created.push(result);
    }

    res.status(201).json({
      message: 'Aktivitas berhasil ditambahkan ke booking terakhir',
      data: created
    });

  } catch (err) {
    console.error('Error addActivityToLatestBooking:', err);
    res.status(500).json({
      message: 'Gagal menambahkan aktivitas',
      error: err?.response?.data || err.message || err
    });
  }
};
