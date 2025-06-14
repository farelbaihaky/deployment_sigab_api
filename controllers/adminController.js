const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// 🔐 Login Admin
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM sigab_app.admin WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      // Log login gagal
      await pool.query(
        `INSERT INTO sigab_app.logs_activity_admin 
          (id_admin, action, method, endpoint, ip_address, device_info)
         VALUES (NULL, $1, $2, $3, $4, $5)`,
        [
          'Login gagal (username/password salah)',
          req.method,
          req.originalUrl,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent']
        ]
      );

      return res.status(401).json({
        success: false,
        message: 'Perhatikan username dan password',
      });
    }

    const admin = result.rows[0];
    const token = jwt.sign({ id: admin.id_admin }, process.env.JWT_SECRET, {
      expiresIn: '7d', // Token kedaluwarsa dalam 7 hari
    });

    // Data tambahan
    const createdAt = new Date();
    const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 hari
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceInfo = req.headers['user-agent'];
    const status = 'active';

    // Cek apakah token untuk admin sudah ada
    const existingToken = await pool.query(
      'SELECT * FROM sigab_app.token_admin WHERE id_admin = $1',
      [admin.id_admin]
    );

    if (existingToken.rows.length > 0) {
      // update token lama
      await pool.query(
        `UPDATE sigab_app.token_admin 
         SET token = $1, created_at = $2, expired_at = $3, ip_address = $4, device_info = $5, status = $6 
         WHERE id_admin = $7`,
        [token, createdAt, expiredAt, ipAddress, deviceInfo, status, admin.id_admin]
      );
    } else {
      // insert token baru
      await pool.query(
        `INSERT INTO sigab_app.token_admin 
         (id_admin, token, created_at, expired_at, ip_address, device_info, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [admin.id_admin, token, createdAt, expiredAt, ipAddress, deviceInfo, status]
      );
    }

    // Log aktivitas login
    await pool.query(
      `INSERT INTO sigab_app.logs_activity_admin 
        (id_admin, action, method, endpoint, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        admin.id_admin,
        'Login admin',
        req.method,
        req.originalUrl,
        ipAddress,
        deviceInfo
      ]
    );

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id: admin.id_admin,
        username: admin.username,
        token: token,
      },
    });
  } catch (error) {
    console.error('Error during login process:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan!' });
  }
};

// 🔐 Logout Admin
exports.logoutAdmin = async (req, res) => {
  const authHeader = req.headers.authorization;

  // Pastikan ada token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi token dan ambil id_admin
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_admin = decoded.id;

    // Hapus token dari DB
    await pool.query(
      'DELETE FROM sigab_app.token_admin WHERE id_admin = $1',
      [id_admin]
    );

    // Log aktivitas logout
    await pool.query(
      `INSERT INTO sigab_app.logs_activity_admin 
        (id_admin, action, method, endpoint, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id_admin,
        'Logout admin',
        req.method,
        req.originalUrl,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      ]
    );

    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};
