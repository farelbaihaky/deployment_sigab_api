const pool = require('../config/db');
// 👁️ READ Laporan Banjir ALL
exports.getAllLaporanBanjir = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          id_laporan,
          id_user,
          tipe_laporan,
          lokasi,
          titik_lokasi,
          waktu,
          deskripsi,
          status,
          id_admin,
          foto
        FROM sigab_app.laporan
        WHERE tipe_laporan = 'Banjir'
        ORDER BY created_at ASC
      `);
  
      res.json({
        success: true,
        message: 'Berhasil mengambil laporan banjir',
        data: result.rows,
      });
    } catch (error) {
      console.error('Gagal ambil laporan banjir:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil laporan banjir',
      });
    }
  };
  

// 👁️ READ Laporan Banjir by ID
exports.getLaporanBanjirById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        id_laporan,
        id_user,
        tipe_laporan,
        lokasi,
        titik_lokasi,
        waktu,
        deskripsi,
        status,
        id_admin,
        foto
      FROM sigab_app.laporan
      WHERE tipe_laporan = 'Banjir' AND id_laporan = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laporan banjir tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Berhasil mengambil detail laporan banjir',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Gagal ambil detail laporan banjir:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan banjir',
    });
  }
};


// 👁️ READ Laporan Banjir dengan status VALID
exports.getLaporanBanjirValid = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id_laporan,
        l.id_user,
        l.tipe_laporan,
        l.waktu,
        l.deskripsi,
        l.status,
        l.id_admin,
        l.foto,
        l.created_at,
        l.updated_at,
        l.lokasi,
        l.titik_lokasi,
        u.nomor_wa,
        u.nama
      FROM sigab_app.laporan AS l
      JOIN sigab_app.user_app AS u
        ON l.id_user = u.id_user
      WHERE l.status = 'Valid'
      ORDER BY l.waktu DESC
    `);
    res.json({
      success: true,
      message: 'Berhasil mengambil data informasi banjir yang valid',
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ Gagal ambil data informasi banjir valid:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// 👁️ READ Laporan Banjir dengan status TIDAK VALID
exports.getLaporanBanjirTidakValid = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id_laporan,
        l.id_user,
        l.tipe_laporan,
        l.waktu,
        l.deskripsi,
        l.status,
        l.id_admin,
        l.foto,
        l.created_at,
        l.updated_at,
        l.lokasi,
        l.titik_lokasi,
        u.nomor_wa,
        u.nama
      FROM sigab_app.laporan AS l
      JOIN sigab_app.user_app AS u
        ON l.id_user = u.id_user
      WHERE l.status = 'Tidak Valid'
      
      ORDER BY l.waktu DESC
    `);
    res.json({
      success: true,
      message: 'Berhasil mengambil data informasi banjir yang tidak valid',
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ Gagal ambil data informasi banjir tidak valid:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// 👁️ READ Laporan Banjir dengan status null + nomor_wa
exports.getLaporanBanjirStatusNull = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id_laporan,
        l.id_user,
        l.tipe_laporan,
        l.waktu,
        l.deskripsi,
        l.status,
        l.id_admin,
        l.foto,
        l.created_at,
        l.updated_at,
        l.lokasi,
        l.titik_lokasi,
        u.nomor_wa,
        u.nama
      FROM sigab_app.laporan AS l
      JOIN sigab_app.user_app AS u
        ON l.id_user = u.id_user
      WHERE l.status IS NULL
        AND l.tipe_laporan = 'Banjir'
      ORDER BY l.created_at DESC
    `);

    res.json({
      success: true,
      message: 'Berhasil mengambil data informasi banjir yang tidak valid',
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ Gagal ambil data informasi banjir tidak valid:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// ✅ CREATE Laporan Banjir
exports.createLaporanBanjir = async (req, res) => {
  const { id_user, tipe_laporan, lokasi, titik_lokasi, waktu, deskripsi, status, id_admin } = req.body;
  const foto = req.file?.filename; // Ambil nama file foto yang diupload
  const fotoUrl = req.file?.publicUrl; // Ambil URL publik dari Supabase

  // Jika status kosong, set status menjadi null
  const statusValue = status ? status : null; 

  try {
    const result = await pool.query(
      `INSERT INTO sigab_app.laporan 
        (id_user, tipe_laporan, lokasi, titik_lokasi, waktu, deskripsi, status, id_admin, foto, foto_url, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
       RETURNING *;`,
      [id_user, tipe_laporan, lokasi, titik_lokasi, waktu, deskripsi, statusValue, id_admin, foto, fotoUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Laporan banjir berhasil ditambahkan',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Gagal menambahkan laporan banjir:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan laporan banjir',
    });
  }
};





