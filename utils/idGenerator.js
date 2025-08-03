const crypto = require('crypto');

/**
 * Generate random booking ID dengan format: BK-YYYYMMDD-XXXXX
 */
function generateBookingId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `BK-${dateStr}-${randomStr}`;
}

/**
 * Generate kode aktivitas berurutan untuk satu booking
 */
function generateActivityCode(sequence) {
  return `act${String(sequence).padStart(3, '0')}`;
}

/**
 * Ambil nomor urut berikutnya dari aktivitas berdasarkan booking ID sistem
 */
async function getNextActivitySequence(pb, bookingSystemId) {
  try {
    const result = await pb.collection('booking_activities').getFullList({
      filter: `booking_id = "${bookingSystemId}"`,
    });

    if (result.length === 0) return 1;

    const numbers = result.map(a => parseInt((a.code_activity || '').replace('act', '')) || 0);
    const maxNumber = Math.max(...numbers);

    return maxNumber + 1;
  } catch (err) {
    console.error('Sequence error:', err.message || err);
    return 1;
  }
}

module.exports = {
  generateBookingId,
  generateActivityCode,
  getNextActivitySequence
};
