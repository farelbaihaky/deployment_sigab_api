const pool = require('../config/db');

// 📥 CREATE Informasi Banjir
exports.createInformasiBanjir = async (req, res) => {
  const { wilayah_banjir, kategori_kedalaman, waktu_kejadian, koordinat_lokasi, tingkat_kedalaman } = req.body;

  // Pastikan id_admin sudah ada setelah autentikasi
  const id_admin = req.admin?.id;
  if (!id_admin) {
    return res.status(401).json({ success: false, message: 'Admin tidak terautentikasi' });
  }

  try {
    // Ubah string "POINT(longitude latitude)" jadi format yang bisa dipakai di SQL POINT
    let longitude = null;
    let latitude = null;

    if (koordinat_lokasi && typeof koordinat_lokasi === 'string') {
      const pointMatch = koordinat_lokasi.match(/^POINT\(([^ ]+) ([^ ]+)\)$/);
      if (pointMatch && pointMatch.length === 3) {
        longitude = parseFloat(pointMatch[1]);
        latitude = parseFloat(pointMatch[2]);
      }
    }

    // Pastikan longitude dan latitude adalah angka valid
    if (longitude === null || latitude === null || isNaN(longitude) || isNaN(latitude)) {
       console.error('❌ Gagal parse koordinat lokasi: Invalid format or values', koordinat_lokasi);
       return res.status(400).json({ success: false, message: 'Format koordinat lokasi tidak valid' });
    }

    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Cari ID berikutnya yang tersedia
      const maxIdResult = await pool.query(`
        SELECT COALESCE(MAX(id_info_banjir), 0) + 1 as next_id 
        FROM sigab_app.informasi_banjir
      `);
      const nextId = maxIdResult.rows[0].next_id;

      // Query untuk memasukkan data informasi banjir dengan ID yang sudah ditemukan
      const result = await pool.query(`
        INSERT INTO sigab_app.informasi_banjir (
          id_info_banjir,
          id_admin, 
          wilayah_banjir, 
          kategori_kedalaman, 
          waktu_kejadian, 
          koordinat_lokasi, 
          tingkat_kedalaman,
          created_at,
          updated_at
        ) 
        VALUES (
          $1,
          $2, $3, $4, $5, POINT($6, $7), $8,
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta',
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        )
        RETURNING *;
      `, [nextId, id_admin, wilayah_banjir, kategori_kedalaman, waktu_kejadian, longitude, latitude, tingkat_kedalaman]);
      
      const infoBanjir = result.rows[0];

      // Simpan ke riwayat banjir
      await pool.query(`
        INSERT INTO sigab_app.riwayat_banjir (
          id_riwayat,
          id_admin,
          wilayah_banjir,
          kategori_kedalaman,
          waktu_kejadian,
          koordinat_lokasi,
          tingkat_kedalaman
        ) VALUES (
          nextval('sigab_app.riwayat_banjir_id_riwayat_seq'),
          $1, $2, $3, $4, POINT($5, $6), $7
        )
      `, [id_admin, wilayah_banjir, kategori_kedalaman, waktu_kejadian, longitude, latitude, tingkat_kedalaman]);

      // Cari ID notifikasi berikutnya yang tersedia
      const maxNotifIdResult = await pool.query(`
        SELECT COALESCE(MAX(id_notifikasi), 0) + 1 as next_id 
        FROM sigab_app.notifikasi
      `);
      const nextNotifId = maxNotifIdResult.rows[0].next_id;

      // Membuat notifikasi otomatis dengan ID yang sudah ditemukan
      await pool.query(`
        INSERT INTO sigab_app.notifikasi (
          id_notifikasi,
          judul,
          pesan,
          created_at,
          updated_at
        ) VALUES (
          $1,
          'Informasi Banjir Terbaru',
          $2,
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta',
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        )
      `, [nextNotifId, `Banjir terdeteksi di wilayah ${wilayah_banjir}, Mohon waspada`]);

      // Commit transaksi
      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Informasi banjir berhasil ditambahkan',
        data: infoBanjir
      });
    } catch (error) {
      // Rollback jika terjadi error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Gagal create informasi banjir:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan informasi banjir',
      error: error.message
    });
  }
};

// 👁️ READ Semua Informasi Banjir
exports.getAllInformasiBanjir = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sigab_app.informasi_banjir ORDER BY created_at DESC`);
    res.json({ success: true, message: 'Berhasil mengambil data informasi banjir', data: result.rows });
  } catch (err) {
    console.error('❌ Gagal ambil data informasi banjir:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data' });
  }
};

// 👁️ READ Informasi Banjir by ID
exports.getInformasiBanjirById = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT * FROM sigab_app.informasi_banjir WHERE id_info_banjir = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Informasi banjir tidak ditemukan',
        });
      }

      res.json({
        success: true,
        message: 'Berhasil mengambil detail informasi banjir',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('❌ Gagal ambil detail informasi banjir:', err);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
      });
    }
};

// ✏️ UPDATE Informasi Banjir
exports.updateInformasiBanjir = async (req, res) => {
  const id = req.params.id;
  const { wilayah_banjir, kategori_kedalaman, tingkat_kedalaman, waktu_kejadian, koordinat_lokasi } = req.body;

  try {
    // Parse coordinates from POINT string or JSON object
    let longitude = null;
    let latitude = null;

    if (koordinat_lokasi) {
      if (typeof koordinat_lokasi === 'string') {
        // Handle POINT string format: "POINT(longitude latitude)"
        const pointMatch = koordinat_lokasi.match(/^POINT\(([^ ]+) ([^ ]+)\)$/);
        if (pointMatch && pointMatch.length === 3) {
          longitude = parseFloat(pointMatch[1]);
          latitude = parseFloat(pointMatch[2]);
        }
      } else if (typeof koordinat_lokasi === 'object') {
        // Handle JSON object format: {x: longitude, y: latitude}
        longitude = parseFloat(koordinat_lokasi.x);
        latitude = parseFloat(koordinat_lokasi.y);
      }
    }

    // Validate coordinates
    if (longitude === null || latitude === null || isNaN(longitude) || isNaN(latitude)) {
      console.error('❌ Gagal parse koordinat lokasi: Invalid format or values', koordinat_lokasi);
      return res.status(400).json({ success: false, message: 'Format koordinat lokasi tidak valid' });
    }

    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Ambil data lama sebelum update
      const oldData = await pool.query(`
        SELECT * FROM sigab_app.informasi_banjir WHERE id_info_banjir = $1
      `, [id]);

      if (oldData.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Data dengan id_info_banjir ${id} tidak ditemukan`
        });
      }

      // Update data baru
      const result = await pool.query(`
        UPDATE sigab_app.informasi_banjir
        SET wilayah_banjir = $1,
            kategori_kedalaman = $2,
            tingkat_kedalaman = $3,
            waktu_kejadian = $4,
            koordinat_lokasi = POINT($5, $6),
            updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        WHERE id_info_banjir = $7
        RETURNING *;
      `, [wilayah_banjir, kategori_kedalaman, tingkat_kedalaman, waktu_kejadian, longitude, latitude, id]);

      // Simpan data baru ke riwayat
      await pool.query(`
        INSERT INTO sigab_app.riwayat_banjir (
          id_riwayat,
          id_admin,
          wilayah_banjir,
          kategori_kedalaman,
          waktu_kejadian,
          koordinat_lokasi,
          tingkat_kedalaman
        ) VALUES (
          nextval('sigab_app.riwayat_banjir_id_riwayat_seq'),
          $1, $2, $3, $4, POINT($5, $6), $7
        )
      `, [
        oldData.rows[0].id_admin,
        wilayah_banjir,
        kategori_kedalaman,
        waktu_kejadian,
        longitude,
        latitude,
        tingkat_kedalaman
      ]);

      // Commit transaksi
      await pool.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Informasi banjir berhasil diupdate',
        data: result.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('❌ Gagal update informasi banjir:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
};

// 🗑️ DELETE Informasi Banjir
exports.deleteInformasiBanjir = async (req, res) => {
  const id = req.params.id;

  try {
    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Ambil data sebelum dihapus
      const oldData = await pool.query(`
        SELECT * FROM sigab_app.informasi_banjir WHERE id_info_banjir = $1
      `, [id]);

      if (oldData.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Data dengan id_info_banjir ${id} tidak ditemukan`,
        });
      }

      // Hapus data dari informasi_banjir
      const result = await pool.query(`
        DELETE FROM sigab_app.informasi_banjir 
        WHERE id_info_banjir = $1 
        RETURNING *;
      `, [id]);

      // Commit transaksi
      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Informasi banjir berhasil dihapus',
        data: result.rows[0],
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('❌ Gagal hapus informasi banjir:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data',
      error: err.message,
    });
  }
};



