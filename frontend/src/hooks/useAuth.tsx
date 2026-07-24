import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, login as loginRequest, register as registerRequest } from '../api/authApi';
import type { User } from '../types/user';

const AUTH_TOKEN_KEY = 'interview_tracker_auth_token';

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login(email: string, password: string): Promise<void>;
    register(email: string, password: string): Promise<void>;
    logout(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!existingToken) {
            setLoading(false);
            return;
        }

        fetchCurrentUser()
            .then((currentUser) => {
                setUser(currentUser);
                setToken(existingToken);
            })
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                setUser(null);
                setToken(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function login(email: string, password: string) {
        const data = await loginRequest(email, password);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
    }

    async function register(email: string, password: string) {
        const data = await registerRequest(email, password);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
    }

    function logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
    }

    const value = useMemo(
        () => ({ user, token, loading, login, register, logout }),
        [user, token, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
