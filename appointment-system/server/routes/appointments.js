const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
} = require('../controllers/appointmentController');

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/my', protect, authorize('patient', 'doctor'), getMyAppointments);
router.patch('/:id/cancel', protect, authorize('patient', 'doctor'), cancelAppointment);
router.patch('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);
router.patch('/:id/complete', protect, authorize('doctor'), completeAppointment);

module.exports = router;
