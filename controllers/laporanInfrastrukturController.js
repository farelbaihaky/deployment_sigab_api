// 👁️ READ Laporan Infrastruktur ALL
const pool = require('../config/db');
exports.getAllLaporanInfrastruktur = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id_laporan,
        l.id_user,
        l.tipe_laporan,
        l.lokasi,
        l.waktu,
        l.deskripsi,
        l.status,
        l.id_admin,
        l.foto,
        u.nama,
        CASE 
          WHEN l.titik_lokasi IS NOT NULL 
          THEN SPLIT_PART(REPLACE(REPLACE(l.titik_lokasi::text, 'POINT(', ''), ')', ''), ' ', 1)
          ELSE NULL 
        END as longitude,
        CASE 
          WHEN l.titik_lokasi IS NOT NULL 
          THEN SPLIT_PART(REPLACE(REPLACE(l.titik_lokasi::text, 'POINT(', ''), ')', ''), ' ', 2)
          ELSE NULL 
        END as latitude
      FROM sigab_app.laporan AS l
      LEFT JOIN sigab_app.user_app AS u
        ON l.id_user = u.id_user
      WHERE l.tipe_laporan = 'Infrastruktur'
      ORDER BY l.created_at DESC
    `);

    console.log('Query result:', result.rows); // Debug log

    res.json({
      success: true,
      message: 'Berhasil mengambil laporan infrastruktur',
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Gagal ambil laporan infrastruktur:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan infrastruktur',
      error: error.message // Include error message for debugging
    });
  }
};


// 👁️ READ Laporan Infrastruktur by ID
exports.getLaporanInfrastrukturById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        l.id_laporan,
        l.id_user,
        l.tipe_laporan,
        l.lokasi,
        l.waktu,
        l.deskripsi,
        l.status,
        l.id_admin,
        l.foto,
        u.nama,
        CASE 
          WHEN l.titik_lokasi IS NOT NULL 
          THEN SPLIT_PART(REPLACE(REPLACE(l.titik_lokasi::text, 'POINT(', ''), ')', ''), ' ', 1)
          ELSE NULL 
        END as longitude,
        CASE 
          WHEN l.titik_lokasi IS NOT NULL 
          THEN SPLIT_PART(REPLACE(REPLACE(l.titik_lokasi::text, 'POINT(', ''), ')', ''), ' ', 2)
          ELSE NULL 
        END as latitude
      FROM sigab_app.laporan AS l
      LEFT JOIN sigab_app.user_app AS u
        ON l.id_user = u.id_user
      WHERE l.tipe_laporan = 'Infrastruktur' AND l.id_laporan = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laporan infrastruktur tidak ditemukan',
      });
    }

    console.log('Query result by ID:', result.rows[0]); // Debug log

    res.json({
      success: true,
      message: 'Berhasil mengambil detail laporan infrastruktur',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Gagal ambil detail laporan infrastruktur:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan infrastruktur',
      error: error.message // Include error message for debugging
    });
  }
};
