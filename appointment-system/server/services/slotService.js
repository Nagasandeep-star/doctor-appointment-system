/**
 * slotService.js
 *
 * Pure function — generates available HH:mm time slots for a doctor on a given date.
 * No DB writes. Slots are computed on-the-fly.
 *
 * Algorithm:
 *   1. Find the doctor's weeklyAvailability entry for the target weekday.
 *   2. Split the window [start, end) into slotDuration-minute increments.
 *   3. Remove slots that are already booked (status = "booked").
 *   4. Remove slots on a leave date.
 *   5. Remove past slots when the date is today.
 */

const { parse, format, addMinutes, isAfter, isBefore, parseISO } = require('date-fns');

/**
 * Parse "HH:mm" into a Date object anchored to a reference date.
 * @param {string} timeStr  "HH:mm"
 * @param {Date}   refDate  Any date — only used as anchor
 */
const parseTime = (timeStr, refDate) => {
  return parse(timeStr, 'HH:mm', refDate);
};

/**
 * Generate all slots within [startTime, endTime) by slotDuration minutes.
 */
const generateAllSlots = (startTime, endTime, slotDuration, refDate) => {
  const slots = [];
  let current = parseTime(startTime, refDate);
  const end = parseTime(endTime, refDate);

  while (isBefore(current, end)) {
    slots.push(format(current, 'HH:mm'));
    current = addMinutes(current, slotDuration);
  }
  return slots;
};

/**
 * Get available slots for a doctor on a specific date.
 *
 * @param {Object}   doctor          Doctor document (with weeklyAvailability, leaveDates, slotDuration)
 * @param {string}   dateStr         "YYYY-MM-DD"
 * @param {string[]} bookedSlots     Array of already-booked HH:mm strings for that doctor+date
 * @returns {string[]}               Array of available "HH:mm" strings
 */
const getAvailableSlots = (doctor, dateStr, bookedSlots = []) => {
  const refDate = parseISO(dateStr); // Date object for the requested date
  const weekday = refDate.getDay(); // 0 = Sunday, 6 = Saturday

  // 1. Check leave
  if (doctor.leaveDates && doctor.leaveDates.includes(dateStr)) {
    return [];
  }

  // 2. Find availability for this weekday
  const availability = (doctor.weeklyAvailability || []).find(
    (a) => a.day === weekday
  );
  if (!availability) {
    return [];
  }

  // 3. Generate all possible slots
  const allSlots = generateAllSlots(
    availability.start,
    availability.end,
    doctor.slotDuration || 30,
    refDate
  );

  // 4. Remove booked slots
  const bookedSet = new Set(bookedSlots);

  // 5. Remove past slots if date is today
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const isToday = dateStr === todayStr;

  return allSlots.filter((slot) => {
    if (bookedSet.has(slot)) return false;
    if (isToday) {
      const slotTime = parseTime(slot, refDate);
      if (!isAfter(slotTime, now)) return false;
    }
    return true;
  });
};

module.exports = { getAvailableSlots };
