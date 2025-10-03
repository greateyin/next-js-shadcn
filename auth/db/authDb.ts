import { User, LoginCredentials, RegisterCredentials } from '../types';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authenticates a user against the database
 * @param credentials - The user's login credentials
 * @returns Promise resolving to the authenticated user
 * @throws Error if user not found, invalid password, or SSO-only account
 */
export async function loginUser(credentials: LoginCredentials): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: { loginMethods: true }
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    const hasPasswordMethod = user.loginMethods.some(method => method.method === 'password');
  
    if (!hasPasswordMethod) {
      throw new Error('This account can only be accessed via SSO');
    }
  
    if (!user.password) {
      throw new Error('Password not set for this user');
    }
  
    const isPasswordValid = await verifyPassword(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
  
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
    };
  }
  
/**
 * Creates a new user in the database
 * @param credentials - The new user's registration information
 * @returns Promise resolving to the newly created user
 * @throws Error if user already exists
 */
export async function registerUser(credentials: RegisterCredentials): Promise<User> {
  return prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findUnique({ where: { email: credentials.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(credentials.password);
    const newUser = await prisma.user.create({
      data: {
        email: credentials.email,
        name: credentials.name,
        password: hashedPassword,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
  });
}