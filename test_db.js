const pool = require('./config/db'); // pastikan path ke file db.js bener
require('dotenv').config();

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Koneksi berhasil ke database!');
    console.log('⏱ Waktu sekarang di DB:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Gagal konek ke database:', err.message);
  } finally {
    await pool.end();
  }
})();
