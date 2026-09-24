const { z } = require('zod');

const availabilitySlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
}).refine((data) => data.start < data.end, {
  message: 'Start time must be before end time',
  path: ['end'],
});

const setAvailabilitySchema = z.object({
  weeklyAvailability: z
    .array(availabilitySlotSchema)
    .min(1, 'At least one availability slot is required'),
  slotDuration: z.number().int().min(10).max(120).optional(),
});

const addLeaveSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const removeLeaveSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

module.exports = { setAvailabilitySchema, addLeaveSchema, removeLeaveSchema };
