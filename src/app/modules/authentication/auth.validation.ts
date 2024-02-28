import { z } from 'zod';

export const userSchema = z.object({
  name: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  email: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  isEmailVerified: z.string({
    invalid_type_error: ' must be boolean',
    required_error: ' is required',
  }),
  password: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  role: z.enum(['admin', 'vendor', 'customer'], {
    invalid_type_error: 'User must be either admin, vendor or customer',
    required_error: ' is required',
  }),
  lastTwoPasswords: z
    .array(
      z
        .object({
          oldPassword: z
            .string({
              invalid_type_error: ' must be string',
              required_error: ' is required',
            })
            .optional(),
          changedAt: z
            .date({
              invalid_type_error: ' must be a valid date',
              required_error: ' is required',
            })
            .optional(),
        })
        .optional(),
    )
    .optional(),
  profileImage: z
    .string({
      invalid_type_error: ' must be string',
      required_error: ' is required',
    })
    .optional(),
  isBlocked: z.boolean({
    invalid_type_error: ' must be boolean',
    required_error: ' is required',
  }),
});

export const signupSchema = z.object({
  name: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  email: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  password: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  role: z.enum(['admin', 'vendor', 'customer'], {
    invalid_type_error: 'User must be either admin, vendor or customer',
    required_error: ' is required',
  }),
});

export const loginSchema = z.object({
  email: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  password: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  newPassword: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
});

export const forgotPasswordSchema = z.object({
  userEmail: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
});

export const resetForgottenPasswordSchema = z.object({
  userEmail: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
  newPassword: z.string({
    invalid_type_error: ' must be string',
    required_error: ' is required',
  }),
});

export const updateProfileSchema = z.object({
  name: z
    .string({
      invalid_type_error: ' must be string',
      required_error: ' is required',
    })
    .optional(),
  profileImage: z
    .string({
      invalid_type_error: ' must be string',
      required_error: ' is required',
    })
    .optional(),
  isBlocked: z
    .boolean({
      invalid_type_error: ' must be boolean',
      required_error: ' is required',
    })
    .optional(),
});
