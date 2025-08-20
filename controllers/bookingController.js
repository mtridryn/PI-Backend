const pb = require('../pocketbase/pbClient');
const { generateBookingId } = require('../utils/idGenerator');

exports.createBooking = async (req, res) => {
  try {
    const data = req.body;

    // Validasi transportasi
    if (data.transport === 'Yes' && (!data.transport_type || data.transport_type.trim() === '')) {
      return res.status(400).json({ message: 'Harus memilih tipe transportasi jika memilih Yes' });
    }

    if (data.transport === 'No' && (!data.nomor_driver || data.nomor_driver.trim() === '')) {
      return res.status(400).json({ message: 'Harus mengisi nomor sopir jika tidak memilih transportasi' });
    }

    // Generate booking ID yang unik
    let bookingId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      bookingId = generateBookingId();

      try {
        // Cek apakah booking_id sudah dipakai
        await pb.collection('booking_uab').getFirstListItem(`booking_id = "${bookingId}"`);
        attempts++;
      } catch (error) {
        if (error.status === 404) {
          isUnique = true; // ID belum dipakai
        } else {
          throw error;
        }
      }
    }

    if (!isUnique) {
      return res.status(500).json({
        message: 'Gagal generate booking ID yang unik, silakan coba lagi'
      });
    }

    // Simpan ke PocketBase
    const booking = await pb.collection('booking_uab').create({
      ...data,
      booking_id: bookingId,
      user_id: req.user.id
    });

    res.status(201).json({
      message: 'Booking berhasil dibuat',
      data: booking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({
      message: "Gagal membuat booking",
      error: err?.response?.data || err.message || err
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await pb.collection('booking_uab').getFullList({
      filter: `user_id = "${req.user.id}"`,
      sort: '-created',
      expand: 'hotel'
    });

    res.status(200).json({
      message: 'Data booking berhasil diambil',
      data: bookings
    });
  } catch (err) {
    console.error('Error getting user bookings:', err);
    res.status(500).json({
      message: "Gagal mengambil data booking",
      error: err?.response?.data || err.message || err
    });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Ambil berdasarkan booking_id, bukan id sistem PocketBase
    const booking = await pb.collection('booking_uab').getFirstListItem(`booking_id = "${bookingId}"`, {
      expand: 'hotel'
    });

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses ke booking ini'
      });
    }

    res.status(200).json({
      message: 'Detail booking berhasil diambil',
      data: booking
    });
  } catch (err) {
    console.error('Error getting booking by ID:', err);
    if (err.status === 404) {
      return res.status(404).json({
        message: 'Booking tidak ditemukan'
      });
    }
    res.status(500).json({
      message: "Gagal mengambil detail booking",
      error: err?.response?.data || err.message || err
    });
  }
};
