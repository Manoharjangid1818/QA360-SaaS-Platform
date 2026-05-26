import { useState } from 'react';
import { useLocation } from 'wouter';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { Shield } from 'lucide-react';

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => navigate('/dashboard'), 500);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setTimeout(() => navigate('/dashboard'), 500);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mr-3">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QA360</h1>
            <p className="text-xs text-gray-500">Test Management Platform</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create an account</h2>

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            <strong>Demo mode:</strong> Supabase not configured. Any credentials will work.
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required={isSupabaseConfigured} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required={isSupabaseConfigured} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
