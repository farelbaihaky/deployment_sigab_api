const pool = require('../config/db');

// ✅ CREATE Tips Mitigasi
exports.createTipsMitigasi = async (req, res) => {
  const { judul, deskripsi } = req.body;
  const id_admin = req.admin?.id;
  const media = req.file?.publicUrl;

  try {
    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Cari ID berikutnya yang tersedia
      const maxIdResult = await pool.query(`
        SELECT COALESCE(MAX(id_tips), 0) + 1 as next_id 
        FROM sigab_app.tips_mitigasi
      `);
      const nextId = maxIdResult.rows[0].next_id;

      const result = await pool.query(
        `INSERT INTO sigab_app.tips_mitigasi 
          (id_tips, id_admin, judul, deskripsi, media, created_at, tanggal_dibuat) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') 
         RETURNING *;`,
        [nextId, id_admin, judul, deskripsi, media]
      );

      // Commit transaksi
      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Tips mitigasi berhasil ditambahkan',
        data: result.rows[0],
      });
    } catch (error) {
      // Rollback jika terjadi error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Gagal menambahkan tips mitigasi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan tips mitigasi',
    });
  }
};

  
  

// ✅ READ Semua Tips Mitigasi
exports.getAllTipsMitigasi = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sigab_app.tips_mitigasi ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Gagal mengambil tips mitigasi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data' });
  }
};

// ✅ READ Tips Mitigasi by ID
exports.getTipsMitigasiById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT * FROM sigab_app.tips_mitigasi WHERE id_tips = $1`,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tips mitigasi tidak ditemukan',
        });
      }
  
      res.json({
        success: true,
        message: 'Berhasil mengambil tips mitigasi',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ Gagal mengambil tips mitigasi by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data tips mitigasi',
      });
    }
  };
  

// ✅ UPDATE Tips Mitigasi
exports.updateTipsMitigasi = async (req, res) => {
  const id = req.params.id;
  const { judul, deskripsi } = req.body;
  const media = req.file?.publicUrl;

  try {
    const check = await pool.query(`SELECT * FROM sigab_app.tips_mitigasi WHERE id_tips = $1`, [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ success: false, message: `Tips dengan ID ${id} tidak ditemukan` });
    }

    const oldData = check.rows[0];

    const result = await pool.query(`
      UPDATE sigab_app.tips_mitigasi
      SET judul = $1, deskripsi = $2, media = $3, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
      WHERE id_tips = $4
      RETURNING *;`,
      [
        judul || oldData.judul,
        deskripsi || oldData.deskripsi,
        media || oldData.media,
        id,
      ]
    );

    res.json({ success: true, message: 'Tips berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    console.error('❌ Gagal update tips mitigasi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat update tips' });
  }
};

// ✅ DELETE Tips Mitigasi
exports.deleteTipsMitigasi = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(`DELETE FROM sigab_app.tips_mitigasi WHERE id_tips = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: `Tips dengan ID ${id} tidak ditemukan` });
    }

    res.json({ success: true, message: 'Tips berhasil dihapus' });
  } catch (error) {
    console.error('❌ Gagal hapus tips mitigasi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus tips' });
  }
};
