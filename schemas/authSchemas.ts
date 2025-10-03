// schemas/authSchemas.ts
import * as z from "zod";

/**
 * Schema for user login.
 * This schema validates the structure and format of login data.
 * 
 * @typedef {Object} LoginSchema
 * @property {string} email - The user's email, must be in a valid email format.
 * @property {string} password - The user's password, must be at least 1 character long.
 */
export const LoginSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long",
    }),
    twoFactorCode: z.optional(z.string()),
});

/**
 * Schema for user reset password.
 * This schema validates the structure and format of reset password data.
 * 
 * @typedef {Object} ResetPasswordSchema
 * @property {string} email - The user's email, must be in a valid email format.
 */
export const ResetPasswordSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address",
    }),
});

/**
 * Schema for setting a new password.
 * This schema validates the structure and format of new password data.
 * 
 * @typedef {Object} NewPasswordSchema
 * @property {string} password - The new password, must be at least 10 characters long and meet complexity requirements.
 * @property {string} confirmPassword - Confirmation of the new password, must match the password field.
 */
export const NewPasswordSchema = z.object({
    password: z.string()
        .min(10, { message: "Password must be at least 10 characters long" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/, {
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        }),
    confirmPassword: z.string().min(1, "Confirm password is required")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

/**
 * Schema for user registration.
 * This schema validates the structure and format of registration data.
 * 
 * @typedef {Object} RegisterSchema
 * @property {string} email - The user's email, must be in a valid email format.
 * @property {string} password - The user's password, must be at least 10 characters long and meet complexity requirements.
 * @property {string} name - The user's name, must be at least 1 character long.
 */
export const RegisterSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long",
    }),
    name: z.string().min(2, {
        message: "Name must be at least 2 characters long",
    }),
});
