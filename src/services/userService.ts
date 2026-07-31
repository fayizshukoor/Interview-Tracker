import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';
import type { User } from '../types/index.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function validateEmail(email: string): string {
    const normalized = normalizeEmail(email);
    if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
        throw new Error('Please enter a valid email address.');
    }
    return normalized;
}

export function validatePassword(password: string): void {
    if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
    if (password.length > 128) throw new Error('Password must be 128 characters or fewer.');
}

export function validateRegistration(email: string, password: string): string {
    const normalizedEmail = validateEmail(email);
    validatePassword(password);
    return normalizedEmail;
}

export async function registerUser(email: string, password: string): Promise<User> {
    const trimmedEmail = validateRegistration(email, password);

    const existing = await userRepository.findByEmail(trimmedEmail);
    if (existing) {
        throw new Error('Email is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return userRepository.create(trimmedEmail, passwordHash);
}

export async function authenticateUser(email: string, password: string): Promise<User> {
    const trimmedEmail = validateEmail(email);
    if (!password) throw new Error('Password is required.');

    const passwordHash = await userRepository.getPasswordHashByEmail(trimmedEmail);
    if (!passwordHash) {
        throw new Error('Invalid email or password.');
    }

    const validPassword = await bcrypt.compare(password, passwordHash);
    if (!validPassword) {
        throw new Error('Invalid email or password.');
    }

    const user = await userRepository.findByEmail(trimmedEmail);
    if (!user) {
        throw new Error('Invalid email or password.');
    }

    return user;
}

export async function getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
}
