const { z } = require('zod');

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['patient', 'doctor']).optional().default('patient'),
    // Doctor-specific fields — only required when role is doctor
    specialization: z.string().optional(),
    experience: z.number().nonnegative().optional(),
    fee: z.number().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'doctor') {
      if (!data.specialization || data.specialization.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['specialization'],
          message: 'Specialization is required for doctors',
        });
      }
      if (data.experience === undefined || data.experience === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['experience'],
          message: 'Experience is required for doctors',
        });
      }
      if (data.fee === undefined || data.fee === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fee'],
          message: 'Consultation fee is required for doctors',
        });
      }
    }
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
