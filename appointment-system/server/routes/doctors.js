const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors,
  getDoctorById,
  setAvailability,
  addLeave,
  removeLeave,
  getMyProfile,
} = require('../controllers/doctorController');
const { getSlotsForDoctor } = require('../controllers/appointmentController');

// Public
router.get('/', getDoctors);
router.get('/me', protect, authorize('doctor'), getMyProfile);
router.get('/:id/slots', getSlotsForDoctor); // /api/doctors/:id/slots?date=YYYY-MM-DD
router.get('/:id', getDoctorById);

// Doctor only
router.put('/availability', protect, authorize('doctor'), setAvailability);
router.post('/leave', protect, authorize('doctor'), addLeave);
router.delete('/leave', protect, authorize('doctor'), removeLeave);

module.exports = router;
