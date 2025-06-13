const express = require('express');
const cors = require('cors');  // Import cors package
const app = express();
const path = require('path');
require('dotenv').config();


// Gunakan CORS untuk mengizinkan akses dari semua origin
app.use(cors());  // <-- Menambahkan middleware CORS

// middleware untuk parsing body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'SIGAP ANJAY MABAR/uploads')));
// import dan daftarkan routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', adminRoutes); // <-- penting! prefix /api

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));