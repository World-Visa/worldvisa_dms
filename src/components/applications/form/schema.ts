import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

export const EditLeadFormSchema = z.object({
  leadId: z.string().optional(),
  fullName: z.string().optional(),
  email: z.email().optional().nullable(),
  avatar: z.string().optional(),
  phone: z
    .string()
    .refine(isValidPhoneNumber, { message: 'Invalid phone number' })
    .optional()
    .or(z.literal(''))
    .optional(),
  assessingAuthority: z.string().optional(),
  suggestedANZSCO: z.string().optional(),
  serviceType: z.string().optional(),
  recordType: z.string().optional(),
});
