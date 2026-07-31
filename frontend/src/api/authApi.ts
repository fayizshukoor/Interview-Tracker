import client from './client';
import type { AuthResponse, User } from '../types/user';

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
}

export async function register(email: string, password: string, otp: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/register', { email, password, otp });
    return response.data;
}

export async function requestOtp(email: string): Promise<{ otp?: string }> {
    const response = await client.post<{ otp?: string }>('/auth/request-otp', { email });
    return response.data;
}

export async function registerWithOtp(email: string, password: string, otp: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/register', { email, password, otp });
    return response.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
    await client.post('/auth/logout', { refreshToken });
}

export async function fetchCurrentUser(): Promise<User> {
    const response = await client.get<User>('/auth/me');
    return response.data;
}
