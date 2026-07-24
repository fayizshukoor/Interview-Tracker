import client from './client';
import type { AuthResponse, User } from '../types/user';

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
    const response = await client.get<User>('/auth/me');
    return response.data;
}
