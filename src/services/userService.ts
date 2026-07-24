import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';
import type { User } from '../types/index.js';

export async function registerUser(email: string, password: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
        throw new Error('A valid email address is required.');
    }

    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
    }

    const existing = await userRepository.findByEmail(trimmedEmail);
    if (existing) {
        throw new Error('Email is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return userRepository.create(trimmedEmail, passwordHash);
}

export async function authenticateUser(email: string, password: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();

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
