const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  listUsers,
  listAllDoctors,
  approveDoctor,
  rejectDoctor,
  getStats,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/doctors', listAllDoctors);
router.patch('/doctors/:id/approve', approveDoctor);
router.patch('/doctors/:id/reject', rejectDoctor);

module.exports = router;
