export interface User {
    id: string;
    email: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
