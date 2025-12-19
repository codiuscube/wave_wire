import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Letter, Key, ArrowLeft } from '@solar-icons/react';
import { Logo } from '../components/ui/Logo';

type AuthMode = 'password' | 'email-otp' | 'verify-otp' | 'forgot-password' | 'reset-sent';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('password');

  const { signIn, signInWithEmailOtp, verifyEmailOtp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signInWithEmailOtp(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setAuthMode('verify-otp');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await verifyEmailOtp(email, otpCode);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setAuthMode('reset-sent');
      setLoading(false);
    }
  };

  const resetToPassword = () => {
    setAuthMode('password');
    setError('');
    setOtpCode('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 text-brand-acid group mb-6">
            <div className="transform -rotate-6 transition-transform group-hover:rotate-0 duration-300">
              <Logo className="w-12 h-12" style={{ filter: 'drop-shadow(0 0 2px rgba(226,253,92,0.5))' }} />
            </div>
            <span className="font-display font-bold text-3xl tracking-wider text-white">
              WAVE_WIRE
            </span>
          </Link>
          <p className="text-slate-400 mt-2">
            {authMode === 'password' && 'Sign in to your account'}
            {authMode === 'email-otp' && 'Sign in with email code'}
            {authMode === 'verify-otp' && 'Enter verification code'}
            {authMode === 'forgot-password' && 'Reset your password'}
            {authMode === 'reset-sent' && 'Check your email'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Password Login Form */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Key weight="Bold" size={16} />
                    Sign In with Password
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuthMode('email-otp')}
                className="w-full py-3 px-4 bg-secondary/50 text-foreground font-semibold rounded-lg hover:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all flex items-center justify-center gap-2"
              >
                <Letter weight="Bold" size={16} />
                Sign In with Email Code
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('forgot-password')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </button>
            </form>
          )}

          {/* Email OTP Form */}
          {authMode === 'email-otp' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email-otp" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email-otp"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                We'll send a 6-digit code to your email.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Letter weight="Bold" size={16} />
                    Send Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetToPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft weight="Bold" size={16} />
                Back to password login
              </button>
            </form>
          )}

          {/* Verify OTP Form */}
          {authMode === 'verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <Letter weight="BoldDuotone" size={48} className="mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  We sent a code to <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-secondary/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('email-otp')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Didn't receive the code? Send again
              </button>

              <button
                type="button"
                onClick={resetToPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft weight="Bold" size={16} />
                Back to password login
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-secondary/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                We'll send you a link to reset your password.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={resetToPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft weight="Bold" size={16} />
                Back to login
              </button>
            </form>
          )}

          {/* Reset Email Sent Confirmation */}
          {authMode === 'reset-sent' && (
            <div className="space-y-6 text-center">
              <Letter weight="BoldDuotone" size={48} className="mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={resetToPassword}
                className="w-full py-3 px-4 bg-secondary/50 text-foreground font-semibold rounded-lg hover:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft weight="Bold" size={16} />
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
