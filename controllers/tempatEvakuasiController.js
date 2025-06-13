const pool = require('../config/db');

// ✅ CREATE
exports.createTempatEvakuasi = async (req, res) => {
  const { nama_tempat, link_gmaps } = req.body;
  const foto = req.file?.publicUrl;

  try {
    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Cari ID berikutnya yang tersedia
      const maxIdResult = await pool.query(`
        SELECT COALESCE(MAX(id_evakuasi), 0) + 1 as next_id 
        FROM sigab_app.tempat_evakuasi
      `);
      const nextId = maxIdResult.rows[0].next_id;

      const result = await pool.query(
        `INSERT INTO sigab_app.tempat_evakuasi 
          (id_evakuasi, nama_tempat, link_gmaps, foto, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') 
         RETURNING *;`,
        [nextId, nama_tempat, link_gmaps, foto]
      );

      // Commit transaksi
      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Tempat evakuasi berhasil ditambahkan',
        data: result.rows[0],
      });
    } catch (error) {
      // Rollback jika terjadi error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Gagal menambahkan tempat evakuasi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan tempat evakuasi',
    });
  }
};


// ✅ READ ALL
exports.getAllTempatEvakuasi = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sigab_app.tempat_evakuasi ORDER BY id_evakuasi DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Error get all:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

// ✅ READ BY ID
exports.getTempatEvakuasiById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM sigab_app.tempat_evakuasi WHERE id_evakuasi = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tempat evakuasi tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error get by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

// ✅ UPDATE
exports.updateTempatEvakuasi = async (req, res) => {
  const { id } = req.params;
  const { nama_tempat, link_gmaps } = req.body;
  const foto = req.file?.publicUrl;

  try {
    const check = await pool.query(`SELECT foto FROM sigab_app.tempat_evakuasi WHERE id_evakuasi = $1`, [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tempat evakuasi tidak ditemukan' });
    }
    const oldFoto = check.rows[0].foto;

    const finalFoto = foto !== null ? foto : oldFoto;

    const result = await pool.query(
      `UPDATE sigab_app.tempat_evakuasi
       SET nama_tempat = $1,
           foto = $2,
           link_gmaps = $3,
           updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
       WHERE id_evakuasi = $4
       RETURNING *`,
      [nama_tempat, finalFoto, link_gmaps, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tempat evakuasi tidak ditemukan' });
    }

    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error update:', err);
    res.status(500).json({ success: false, message: 'Gagal update tempat evakuasi' });
  }
};

// ✅ DELETE
exports.deleteTempatEvakuasi = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM sigab_app.tempat_evakuasi WHERE id_evakuasi = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tempat evakuasi tidak ditemukan' });
    }

    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('❌ Error delete:', err);
    res.status(500).json({ success: false, message: 'Gagal hapus tempat evakuasi' });
  }
};
