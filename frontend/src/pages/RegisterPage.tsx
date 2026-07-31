import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { requestOtp } from '../api/authApi';
import { getApiErrorMessage } from '../api/client';
import { validateEmail, validatePassword } from '../utils/authValidation';

export default function RegisterPage() {
    const { register, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
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
        if (!/^\d{6}$/.test(otp)) { setError('Verification code must be exactly 6 digits.'); return; }

        setSubmitting(true);

        try {
            await register(email.trim(), password, otp);
            navigate('/', { replace: true });
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to register.'));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRequestOtp() {
        setError(null);
        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }
        try {
            const result = await requestOtp(email.trim());
            setOtpSent(true);
            if (result.otp) setOtp(result.otp);
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to send verification code.'));
        }
    }

    return (
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
            <h1>Register</h1>
            <p>Create an account to keep your interview data private.</p>
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

                <button type="button" className="btn" onClick={handleRequestOtp} disabled={submitting || !email}>
                    {otpSent ? 'Resend verification code' : 'Send verification code'}
                </button>

                <label className="form-group">
                    <span className="form-label">Email verification code</span>
                    <input className="input" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} required disabled={submitting} />
                </label>

                <label className="form-group">
                    <span className="form-label">Password</span>
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={submitting}
                    />
                </label>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            <p style={{ marginTop: '1rem' }}>
                Already have an account? <Link to="/login">Sign in</Link>.
            </p>
        </div>
    );
}
