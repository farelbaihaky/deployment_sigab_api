-- Create riwayat_banjir table
CREATE TABLE IF NOT EXISTS sigab_app.riwayat_banjir (
    id_riwayat SERIAL PRIMARY KEY,
    id_admin INTEGER NOT NULL,
    wilayah_banjir VARCHAR(255) NOT NULL,
    kategori_kedalaman VARCHAR(50) NOT NULL,
    waktu_kejadian TIMESTAMP NOT NULL,
    koordinat_lokasi POINT NOT NULL,
    tingkat_kedalaman INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_admin) REFERENCES sigab_app.admin(id)
); 