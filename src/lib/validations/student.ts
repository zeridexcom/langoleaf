import { z } from "zod";

// Phone number validation (Indian format)
const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;

// Email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Student base schema
export const studentBaseSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  email: z
    .string()
    .min(1, "Email is required")
    .regex(emailRegex, "Please enter a valid email address"),
  
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Please enter a valid Indian phone number")
    .transform((val) => {
      // Normalize phone number
      const cleaned = val.replace(/\D/g, "");
      if (cleaned.length === 10) {
        return `+91${cleaned}`;
      }
      return `+${cleaned}`;
    }),
  
  program: z
    .string()
    .min(1, "Program is required"),
  
  university: z
    .string()
    .min(1, "University is required"),
  
  status: z
    .enum([
      "application_submitted",
      "documents_pending",
      "under_review",
      "approved",
      "enrolled",
      "rejected"
    ])
    .default("application_submitted"),
});

// Create student schema
export const createStudentSchema = studentBaseSchema;

// Update student schema (all fields optional)
export const updateStudentSchema = studentBaseSchema.partial();

// Extended student schema with new fields
export const extendedStudentSchema = studentBaseSchema.extend({
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 16 && age <= 100;
    }, "Student must be between 16 and 100 years old"),
  
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional(),
  
  nationality: z
    .string()
    .min(2, "Nationality must be at least 2 characters")
    .optional(),
  
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .optional(),
  
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .optional(),
  
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .optional(),
  
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional(),
  
  emergency_contact_name: z
    .string()
    .min(2, "Emergency contact name must be at least 2 characters")
    .optional(),
  
  emergency_contact_phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional(),
  
  previous_education: z
    .string()
    .min(2, "Previous education must be at least 2 characters")
    .optional(),
  
  work_experience: z
    .string()
    .optional(),
  
  source: z
    .string()
    .optional(),
  
  tags: z
    .array(z.string())
    .optional(),
});

// Type exports
export type StudentBaseInput = z.infer<typeof studentBaseSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ExtendedStudentInput = z.infer<typeof extendedStudentSchema>;

// Validation helper functions
export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

// Error message formatter
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    formatted[path] = err.message;
  });
  
  return formatted;
}
