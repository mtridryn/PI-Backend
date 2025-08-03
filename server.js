const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const bookingActivityRoutes = require('./routes/bookingActivityRoutes');
// const paymentRoutes = require('./routes/paymentRoutes'); // jika sudah ada
// const profileRoutes = require('./routes/profileRoutes'); // jika sudah ada
const pb = require('./pocketbase/pbClient'); // penting untuk akses product_uab

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Route utama
app.use('/', authRoutes);
app.use('/booking', bookingRoutes);
app.use('/booking', bookingActivityRoutes);
// app.use('/payment', paymentRoutes);   // opsional
// app.use('/profile', profileRoutes);   // opsional

// Chatbot
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY belum diatur di .env');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: 'Pesan kosong.' });

  // 1. Ambil instruksi dasar dari file
  let systemInstruction = '';
  try {
    systemInstruction = fs.readFileSync('./chatbot/instruksi.txt', 'utf8');
  } catch {
    systemInstruction = 'Anda adalah asisten AI untuk layanan informasi perusahaan.';
  }

  // 2. Ambil data layanan dari product_uab
  try {
    const products = await pb.collection('product_uab').getFullList({
      sort: 'nama_layanan',
      fields: 'nama_layanan,harga,desc',
    });

    if (products.length > 0) {
      const productList = products.map(p => 
        `- ${p.nama_layanan} (Rp${p.harga}): ${p.desc}`
      ).join('\n');

      systemInstruction += `\n\nBerikut adalah daftar layanan yang tersedia:\n${productList}`;
    }
  } catch (err) {
    console.error('Gagal mengambil data produk:', err.message);
  }

  // 3. Kirim ke Gemini
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reply = response.text || 'Maaf, tidak ada jawaban.';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: 'Terjadi kesalahan pada AI.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
