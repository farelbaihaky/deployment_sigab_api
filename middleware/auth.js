// Middleware untuk memverifikasi token admin
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware untuk memverifikasi token admin + log aktivitas
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak tersedia' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT * FROM sigab_app.token_admin 
       WHERE id_admin = $1 AND token = $2 AND status = 'active'`,
      [decoded.id, token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Token tidak valid, tidak aktif, atau tidak ditemukan' });
    }

    const tokenData = result.rows[0];
    const now = new Date();
    const expiredAt = new Date(tokenData.expired_at);

    if (expiredAt < now) {
      return res.status(401).json({ success: false, message: 'Token telah kedaluwarsa (expired)' });
    }

    // ✅ Logging aktivitas ke logs_activity_admin
    const id_admin = decoded.id;
    
    // Determine action based on HTTP method and endpoint
    let action = '';
    const method = req.method;
    const endpoint = req.originalUrl;

    // Extract resource name from endpoint
    const resourceMatch = endpoint.match(/\/([^\/]+)(?:\/|$)/);
    const resource = resourceMatch ? resourceMatch[1] : '';

    // Extract ID from endpoint if exists
    const idMatch = endpoint.match(/\/([^\/]+)\/([^\/]+)$/);
    const id = idMatch ? idMatch[2] : null;

    // Define variables before res.json override
    const ip_address = req.ip || req.connection.remoteAddress;
    const device_info = req.headers['user-agent'];

    // Determine action berdasarkan method dan endpoint
    switch (method) {
      case 'POST':
        if (endpoint.includes('/create')) {
          // Default action if we don't get the ID from response
          action = `Menambahkan data ${resource}`;
        } else if (endpoint.includes('/login')) {
          action = 'Login ke sistem';
        } else if (endpoint.includes('/logout')) {
          action = 'Logout dari sistem';
        } else {
          action = `Membuat data ${resource}`;
        }
        break;
      case 'PUT':
      case 'PATCH':
        if (endpoint.includes('/update')) {
          // Default action for update
          action = `Mengubah data ${resource} ID: ${id}`;
        } else if (endpoint.includes('/verifikasi')) {
          const status = req.body.status || 'tidak diketahui';
          action = `Memverifikasi ${resource} ID: ${id} menjadi ${status}`;
        } else {
          action = `Memperbarui data ${resource} ID: ${id}`;
        }
        break;
      case 'DELETE':
        if (endpoint.includes('/delete')) {
          action = `Menghapus data ${resource} dengan ID: ${id}`;
        } else {
          action = `Menghapus ${resource} ID: ${id}`;
        }
        break;
      default:
        action = `Akses endpoint ${endpoint}`;
    }

    // Store the original res.json function
    const originalJson = res.json;

    // Override res.json to capture the response data
    res.json = async function(data) {
      // If this is a create request and we have data
      if (method === 'POST' && endpoint.includes('/create') && data && data.data) {
        const newId = data.data.id || data.data.id_info_banjir || data.data.id_tips || data.data.id_evakuasi || data.data.id_laporan;
        if (newId) {
          action = `Menambahkan data ${resource} dengan ID: ${newId}`;
        }
      }

      // Check for foto changes in update response
      if ((method === 'PUT' || method === 'PATCH') && endpoint.includes('/update') && data && data.data) {
        const changes = [];
        
        // Get old data first
        let oldData = {};
        let tableName = '';
        let idColumn = '';
        
        // Determine table name and ID column based on resource
        switch(resource) {
          case 'informasi_banjir':
            tableName = 'sigab_app.informasi_banjir';
            idColumn = 'id_info_banjir';
            break;
          case 'tips_mitigasi':
            tableName = 'sigab_app.tips_mitigasi_bencana';
            idColumn = 'id_tips';
            break;
          case 'tempat_evakuasi':
            tableName = 'sigab_app.tempat_evakuasi';
            idColumn = 'id_evakuasi';
            break;
        }

        if (tableName && id) {
          const result = await pool.query(
            `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
            [id]
          );
          
          if (result.rows.length > 0) {
            oldData = result.rows[0];
          }
        }

        // Check if foto was changed by comparing response data with old data
        if (data.data.foto && data.data.foto !== oldData.foto) {
          changes.push('foto: diganti');
        }

        // Check if foto was changed by comparing response data with old data
        if (data.data.media && data.data.media !== oldData.media) {
          changes.push('media: diganti');
        }

        // Check other fields from request body
        const fieldsToCheck = ['nama_tempat', 'link_gmaps', 'wilayah_banjir', 'kategori_kedalaman', 
                             'waktu_kejadian', 'koordinat_lokasi', 'tingkat_kedalaman', 'judul', 
                             'deskripsi', 'media'];

        for (const field of fieldsToCheck) {
          // Only add to changes if:
          // 1. The field exists in request body
          // 2. The field value is different from old data
          // 3. The field value is not empty/null
          if (req.body[field] !== undefined && 
              req.body[field] !== oldData[field] && 
              req.body[field] !== null && 
              req.body[field] !== '') {
            changes.push(`${field}: ${req.body[field]}`);
          }
        }

        // Only create action if there are actual changes
        if (changes.length > 0) {
          action = `Mengubah data ${resource} ID: ${id} (${changes.join(', ')})`;
        } else {
          action = `Mengubah data ${resource} ID: ${id}`;
        }
      }

      // Insert log before sending response
      try {
        await pool.query(
          `INSERT INTO sigab_app.logs_activity_admin 
            (id_admin, action, method, endpoint, ip_address, device_info)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id_admin, action, method, endpoint, ip_address, device_info]
        );
      } catch (error) {
        console.error('Error inserting log:', error);
      }
      
      // Call the original res.json
      return originalJson.call(this, data);
    };

    // Kirim data admin ke controller
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ success: false, message: 'Token tidak valid atau rusak' });
  }
};

module.exports = verifyAdmin;