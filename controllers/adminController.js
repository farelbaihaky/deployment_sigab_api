const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// 🔐 Login Admin
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  console.log('Received login request:', { username, password });

  try {
    const result = await pool.query(
      'SELECT * FROM sigab_app.admin WHERE username = $1 AND password = $2',
      [username, password]
    );

    console.log('Database query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('Login failed: No matching user found.');
      return res.status(401).json({
        success: false,
        message: 'Perhatikan username dan password',
      });
    }

    const admin = result.rows[0];
    const token = jwt.sign({ id: admin.id_admin }, process.env.JWT_SECRET);

    console.log('Generated token:', token);

    const existingToken = await pool.query(
      'SELECT * FROM sigab_app.token_admin WHERE id_admin = $1',
      [admin.id_admin]
    );

    if (existingToken.rows.length > 0) {
      await pool.query(
        'UPDATE sigab_app.token_admin SET token = $1, created_at = CURRENT_TIMESTAMP WHERE id_admin = $2',
        [token, admin.id_admin]
      );
    } else {
      await pool.query(
        'INSERT INTO sigab_app.token_admin (id_admin, token) VALUES ($1, $2)',
        [admin.id_admin, token]
      );
    }

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

    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};
