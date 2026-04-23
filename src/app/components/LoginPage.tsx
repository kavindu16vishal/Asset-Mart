import { Lock, Mail, User, Shield } from 'lucide-react';
import { useState } from 'react';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'user', userData?: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);

  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (isLogin) {
      // Real backend login
      try {
        const res = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onLogin(data.user.role as 'admin' | 'user', data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Real backend registration
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        // Show recovery codes ONCE and ask user to save them
        setRecoveryCodes(Array.isArray(data.recoveryCodes) ? data.recoveryCodes : []);
        setShowRecoveryCodes(true);
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRecoveryReset = async () => {
    setRecoveryMsg(null);
    if (!recoveryEmail || !recoveryCode || !recoveryNewPassword) {
      setRecoveryMsg('Please fill all fields.');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryMsg('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/users/recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          recoveryCode,
          newPassword: recoveryNewPassword,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setRecoveryMsg('Password reset successful. You can now login.');
      setEmail(recoveryEmail);
      setShowRecoveryModal(false);
      setRecoveryEmail('');
      setRecoveryCode('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } catch (err: any) {
      setRecoveryMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Asset Mart</h1>
            <p className="text-blue-100">Smart IT Asset Management System</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  isLogin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  !isLogin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}
              
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setShowRecoveryModal(true);
                      setRecoveryMsg(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {isLogin && null}
          </div>
        </div>

        <p className="text-center text-white text-sm mt-6">
          © 2026 Asset Mart. All rights reserved.
        </p>
        
      </div>

      {/* Recovery Codes Modal (shown once after registration) */}
      {showRecoveryCodes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Save your Recovery Codes</h2>
              <p className="text-sm text-gray-600 mt-1">
                These codes can reset your password without email. Each code works once.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((c) => (
                  <div key={c} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-900">
                    {c}
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  } catch {
                    // ignore
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
              >
                Copy codes
              </button>
              <button
                onClick={() => setShowRecoveryCodes(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                I saved them
              </button>
              <p className="text-xs text-gray-500">
                If you lose these codes, you’ll need an administrator to reset your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forgot password (Recovery Code) Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Reset password</h2>
              <p className="text-sm text-gray-600 mt-1">Use a recovery code (no email needed).</p>
            </div>
            <div className="p-6 space-y-3">
              {recoveryMsg && (
                <div className="p-3 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-800">
                  {recoveryMsg}
                </div>
              )}
              <input
                type="email"
                placeholder="Email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Recovery code (e.g. ABCD-EF12-3456)"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
              />
              <input
                type="password"
                placeholder="New password"
                value={recoveryNewPassword}
                onChange={(e) => setRecoveryNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={recoveryConfirmPassword}
                onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecoveryReset}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

