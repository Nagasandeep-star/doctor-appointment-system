const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendReminderEmail } = require('../services/emailService');

/**
 * Reminder job — runs every hour at minute 0.
 * Finds booked appointments starting in approximately 24 hours (23h–25h window)
 * with reminderSent === false, sends a reminder email, then sets reminderSent = true.
 */
const startReminderJob = () => {
  // Every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [Reminder Job] Running...');

    try {
      const now = new Date();
      const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Convert window boundaries to YYYY-MM-DD and HH:mm for string comparison
      const formatDate = (d) => d.toISOString().slice(0, 10);
      const formatTime = (d) => d.toISOString().slice(11, 16);

      // Find appointments within the 23h–25h window
      // Since date and startTime are strings, we need to compute the exact matching range
      const targetDate23 = formatDate(in23h);
      const targetDate25 = formatDate(in25h);

      let dateFilter;
      if (targetDate23 === targetDate25) {
        dateFilter = { date: targetDate23 };
      } else {
        dateFilter = { date: { $in: [targetDate23, targetDate25] } };
      }

      const appointments = await Appointment.find({
        ...dateFilter,
        status: 'booked',
        reminderSent: false,
      })
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name' },
        })
        .populate('patient', 'name email');

      // Filter to only appointments that actually fall within [in23h, in25h]
      const eligibleAppointments = appointments.filter((appt) => {
        const apptDateTime = new Date(`${appt.date}T${appt.startTime}:00`);
        return apptDateTime >= in23h && apptDateTime <= in25h;
      });

      console.log(`⏰ [Reminder Job] Found ${eligibleAppointments.length} appointments to remind.`);

      for (const appt of eligibleAppointments) {
        try {
          await sendReminderEmail({
            patientEmail: appt.patient?.email,
            patientName: appt.patient?.name,
            doctorName: appt.doctor?.user?.name || 'Doctor',
            date: appt.date,
            startTime: appt.startTime,
          });

          appt.reminderSent = true;
          await appt.save();
        } catch (err) {
          console.error(`⏰ [Reminder Job] Error sending reminder for appointment ${appt._id}:`, err.message);
        }
      }

      console.log('⏰ [Reminder Job] Complete.');
    } catch (err) {
      console.error('⏰ [Reminder Job] Error:', err.message);
    }
  });

  console.log('⏰ Reminder cron job scheduled (every hour at :00)');
};

module.exports = startReminderJob;
