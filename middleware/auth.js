const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware untuk memverifikasi token admin
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak tersedia' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek token di database
    const result = await pool.query(
      'SELECT * FROM sigab_app.token_admin WHERE id_admin = $1 AND token = $2',
      [decoded.id, token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau tidak ditemukan di database' });
    }

    // Simpan data admin ke request agar bisa dipakai di controller
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

module.exports = verifyAdmin;
