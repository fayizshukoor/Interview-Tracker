import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../api/client';
import { validateEmail, validatePassword } from '../utils/authValidation';

export default function LoginPage() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true });
        }
    }, [loading, user, navigate]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }
        const passwordError = validatePassword(password);
        if (passwordError) { setError(passwordError); return; }

        setSubmitting(true);

        try {
            await login(email.trim(), password);
            navigate('/', { replace: true });
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to log in.'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
            <h1>Login</h1>
            <p>Enter your email and password to access Interview Tracker.</p>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <label className="form-group">
                    <span className="form-label">Email</span>
                    <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={submitting}
                    />
                </label>

                <label className="form-group">
                    <span className="form-label">Password</span>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="input"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            disabled={submitting}
                            style={{ paddingRight: '3rem' }}
                        />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={submitting} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer', fontSize: '1.1rem' }}>
                            {showPassword ? '◉' : '◌'}
                        </button>
                    </div>
                </label>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p style={{ marginTop: '1rem' }}>
                New here? <Link to="/register">Create an account</Link>.
            </p>
        </div>
    );
}
