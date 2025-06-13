const pool = require('../config/db');

// ✅ Verifikasi Laporan Banjir
exports.verifikasiLaporanBanjir = async (req, res) => {
  const id_laporan = req.params.id;
  const { status } = req.body; // diisi 'Valid' atau 'Tidak Valid'
  const id_admin = 1; // ← hardcode admin ID sementara (untuk testing)

  // Validasi input status
  if (!['Valid', 'Tidak Valid'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status harus "Valid" atau "Tidak Valid"',
    });
  }

  if (!id_admin) {
    return res.status(401).json({
      success: false,
      message: 'Admin tidak terautentikasi',
    });
  }

  try {
    // Mulai transaksi
    await pool.query('BEGIN');

    try {
      // Update status laporan
      const result = await pool.query(`
        UPDATE sigab_app.laporan
        SET status = $1,
            id_admin = $2,
            updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        WHERE id_laporan = $3
        RETURNING *;
      `, [status, id_admin, id_laporan]);

      if (result.rowCount === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Laporan dengan ID ${id_laporan} tidak ditemukan`
        });
      }

      // Commit transaksi
      await pool.query('COMMIT');

      // Jika status adalah 'Valid', cek jumlah laporan valid hari ini
      if (status === 'Valid') {
        // Debug: Tampilkan semua laporan dan waktu saat ini
        const debugAllReports = await pool.query(`
          SELECT 
            id_laporan, 
            status, 
            tipe_laporan, 
            waktu,
            DATE(waktu AT TIME ZONE 'Asia/Jakarta') as report_date,
            CURRENT_DATE as current_date,
            created_at,
            DATE(created_at AT TIME ZONE 'Asia/Jakarta') as created_date
          FROM sigab_app.laporan 
          WHERE status = 'Valid'
          AND tipe_laporan = 'Banjir'
          ORDER BY waktu DESC
        `);
        console.log('Debug - All valid reports:', debugAllReports.rows);

        const validReportsCount = await pool.query(`
          SELECT COUNT(*) 
          FROM sigab_app.laporan 
          WHERE status = 'Valid' 
          AND DATE(waktu AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
          AND tipe_laporan = 'Banjir'
        `);

        const count = parseInt(validReportsCount.rows[0].count);
        console.log('Number of valid reports today:', count);

        // Jika ada tepat 3 laporan valid hari ini
        if (count === 3) {
          console.log('Creating notification for 3 valid reports');
          try {
            // Cari ID notifikasi berikutnya yang tersedia
            const maxNotifIdResult = await pool.query(`
              SELECT COALESCE(MAX(id_notifikasi), 0) + 1 as next_id 
              FROM sigab_app.notifikasi
            `);
            const nextNotifId = maxNotifIdResult.rows[0].next_id;
            console.log('Next notification ID:', nextNotifId);

            // Buat notifikasi peringatan
            const notifResult = await pool.query(`
              INSERT INTO sigab_app.notifikasi (
                id_notifikasi,
                judul,
                pesan,
                created_at,
                updated_at
              ) VALUES (
                $1,
                'Peringatan Banjir Terkini',
                'Peringatan! Sepertinya akan ada banjir dalam waktu dekat di sekitar daerah anda',
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta',
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
              ) RETURNING *
            `, [nextNotifId]);

            console.log('Notification created successfully:', notifResult.rows[0]);
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
            throw notifError;
          }
        } else {
          console.log('Not creating notification - count is not 3');
        }
      }

      res.json({
        success: true,
        message: 'Laporan berhasil diverifikasi',
        data: result.rows[0],
      });
    } catch (error) {
      // Rollback jika terjadi error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Gagal verifikasi laporan banjir:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi laporan',
    });
  }
};
