-- Drop existing table if exists
DROP TABLE IF EXISTS sigab_app.tempat_evakuasi;

-- Create table with proper structure
CREATE TABLE sigab_app.tempat_evakuasi (
    id_evakuasi SERIAL PRIMARY KEY,
    nama_tempat VARCHAR(255) NOT NULL,
    link_gmaps TEXT NOT NULL,
    foto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 