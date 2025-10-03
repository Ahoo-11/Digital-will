import { useState } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPanel() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Please provide an email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Verification email sent. Please check your inbox to confirm your account.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold">Welcome to Aeturnum</h1>
            </div>
            <p className="text-gray-400">
              {mode === 'signin'
                ? 'Sign in to manage your time-locked vaults.'
                : 'Create an account to securely store your digital legacy.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter a strong password"
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 8 characters. Use a password manager for best security.
              </p>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
              {message}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            {mode === 'signin' ? (
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setMessage(null);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Need an account? Sign up
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setMessage(null);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
