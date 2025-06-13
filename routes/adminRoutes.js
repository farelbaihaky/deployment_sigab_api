const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const laporanBanjirController = require('../controllers/laporanBanjirController');
const laporanInfrastrukturController = require('../controllers/laporanInfrastrukturController');
const informasiBanjirController = require('../controllers/informasiBanjirController');
const { verifikasiLaporanBanjir } = require('../controllers/verifikasiLaporanBanjirController');
const tipsController = require('../controllers/tipsMitigasiController');
const { upload, uploadToSupabase } = require('../middleware/upload');
const auth = require('../middleware/auth');
const tempatEvakuasiController = require('../controllers/tempatEvakuasiController');
const riwayatBanjirController = require('../controllers/riwayatBanjirController');




// Endpoint login admin //
router.post('/login', adminController.loginAdmin);
// Endpoint logout admin //
router.post('/logout', adminController.logoutAdmin);


// LAPORAN BANJIR //
// CREATE //
router.post('/laporan/banjir/create', upload.single('foto'), uploadToSupabase, laporanBanjirController.createLaporanBanjir);
// READ ALL//
router.get('/laporan/banjir', laporanBanjirController.getAllLaporanBanjir);
// READ BY VALID //
router.get('/laporan/banjir/valid', laporanBanjirController.getLaporanBanjirValid);
// READ BY TIDAK VALID //
router.get('/laporan/banjir/tidak_valid', laporanBanjirController.getLaporanBanjirTidakValid);
// READ BY STATUS NULL //
router.get('/laporan/banjir/status_null', laporanBanjirController.getLaporanBanjirStatusNull);
// READ BY ID//
router.get('/laporan/banjir/:id', laporanBanjirController.getLaporanBanjirById);


// PATCH //
router.patch('/laporan/banjir/verifikasi/:id', verifikasiLaporanBanjir);

// LAPORAN INFRASTRUKTUR //

// READ ALL//
router.get('/laporan/infrastruktur', auth, laporanInfrastrukturController.getAllLaporanInfrastruktur);
// READ BY ID//
router.get('/laporan/infrastruktur/:id', auth, laporanInfrastrukturController.getLaporanInfrastrukturById);

// INFORMASI BANJIR //
// CREATE //
router.post('/informasi_banjir/create', auth, informasiBanjirController.createInformasiBanjir);
// READ ALL
router.get('/informasi_banjir', informasiBanjirController.getAllInformasiBanjir);
// READ BY ID
router.get('/informasi_banjir/:id', informasiBanjirController.getInformasiBanjirById);
// UPDATE
router.put('/informasi_banjir/update/:id', informasiBanjirController.updateInformasiBanjir);
// DELETE
router.delete('/informasi_banjir/delete/:id', informasiBanjirController.deleteInformasiBanjir);

// TIPS MITIGASI BENCANA //
// CREATE //
router.post('/tips_mitigasi_bencana/create', auth, upload.single('media'), uploadToSupabase, tipsController.createTipsMitigasi);
// READ ALL//
router.get('/tips_mitigasi_bencana', auth, tipsController.getAllTipsMitigasi);
// READ BY ID//
router.get('/tips_mitigasi_bencana/:id', auth, tipsController.getTipsMitigasiById);
// update //
router.put('/tips_mitigasi_bencana/update/:id', auth, upload.single('media'), uploadToSupabase, tipsController.updateTipsMitigasi);
// DELETE //
router.delete('/tips_mitigasi_bencana/delete/:id', auth, tipsController.deleteTipsMitigasi);
module.exports = router;

// TEMPAT EVAKUASI //
// CREATE //
router.post('/tempat_evakuasi/create', auth, upload.single('foto'), uploadToSupabase, tempatEvakuasiController.createTempatEvakuasi);
// READ ALL //
router.get('/tempat_evakuasi', auth, tempatEvakuasiController.getAllTempatEvakuasi);
// READ BY ID //
router.get('/tempat_evakuasi/:id', auth, tempatEvakuasiController.getTempatEvakuasiById);
// UPDATE //
router.put('/tempat_evakuasi/update/:id', auth, upload.single('foto'), uploadToSupabase, tempatEvakuasiController.updateTempatEvakuasi);
// DELETE //
router.delete('/tempat_evakuasi/delete/:id', auth, tempatEvakuasiController.deleteTempatEvakuasi);

// RIWAYAT BANJIR //
// READ ALL //
router.get('/riwayat_banjir', riwayatBanjirController.getAllRiwayatBanjir);

module.exports = router;





