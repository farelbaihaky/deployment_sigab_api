-- Add foto_url column to laporan table
ALTER TABLE sigab_app.laporan ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Add foto_url column to tempat_evakuasi table
ALTER TABLE sigab_app.tempat_evakuasi ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Add media_url column to tips_mitigasi table
ALTER TABLE sigab_app.tips_mitigasi ADD COLUMN IF NOT EXISTS media_url TEXT; 