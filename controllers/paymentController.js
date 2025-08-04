const pb = require('../pocketbase/pbClient');
const midtransClient = require('midtrans-client');
require('dotenv').config();

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY
});

const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Membuat transaksi Snap Midtrans
exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    const transactionStatus = notification.transaction_status;
    const orderId = notification.order_id.replace('ORDER-', '');
    const settlement_time = notification.settlement_time;

    const bookingResult = await pb.collection('booking_uab').getFirstListItem(`booking_id="${orderId}"`);

    if (!bookingResult) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    if (transactionStatus === 'settlement') {
      const activities = await pb.collection('booking_activities').getFullList({
        filter: `booking_id="${bookingResult.id}"`,
        expand: 'activity',
      });

      const total = activities.reduce((sum, act) => {
        const harga = act.expand?.activity?.harga || 0;
        return sum + harga * act.qty;
      }, 0);

      const activityLabels = activities.map((act) => act.expand?.activity?.nama_layanan || 'unknown');

      await pb.collection('history_uab').create({
        booking_id: bookingResult.booking_id,
        nama: bookingResult.nama,
        nomortlp: bookingResult.nomortlp,
        tanggal_book: bookingResult.created, // metadata waktu booking
        tanggal_kegiatan: bookingResult.tanggal_kegiatan, // field dari booking
        tanggal_payment: settlement_time || new Date().toISOString(),
        activity: activityLabels,
        total
      });

      return res.status(200).json({ message: 'Notifikasi berhasil diproses' });
    }

    return res.status(200).json({ message: 'Transaksi tidak settlement' });

  } catch (error) {
    console.error('Gagal memproses notifikasi Midtrans:', error);
    return res.status(500).json({ message: 'Gagal memproses notifikasi Midtrans' });
  }
};
