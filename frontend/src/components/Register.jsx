import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LiquidEther from './LiquidEther';

export const Register = ({ onSwitchToLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, username, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Email or username may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LiquidEther
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        colors={["#5227FF","#FF9FFC","#B19EEF"]}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={2.2}
        isBounce={false}
        resolution={0.5}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <div className="max-w-md w-full" style={{ position: 'relative', zIndex: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg hover:border-white/30 transition-colors text-gray-400 hover:text-white"
          >
            ← Back
          </button>
        )}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Junt
          </h1>
          <p className="text-gray-400">
            The fastest way to digest any new release.
          </p>
        </div>

        <div className="bg-dark-surface backdrop-blur-md rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Sign Up</h2>

          {error && (
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full accent-bg text-white font-semibold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="accent-color hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
