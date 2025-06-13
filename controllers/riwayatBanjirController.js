const pool = require('../config/db');

// ✅ READ ALL
exports.getAllRiwayatBanjir = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sigab_app.riwayat_banjir ORDER BY waktu_kejadian DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Error get all:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};
