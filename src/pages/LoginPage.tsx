import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try Supabase first if configured
      const hasSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (hasSupabase) {
        try {
          if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.user) {
              const role = data.user.email === 'admin@ybt.com' ? 'admin' : 'user';
              setUser({
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata.name || data.user.email!.split('@')[0],
                role: role
              }, (data.session as any)?.access_token);
              toast.success('Welcome back (Supabase)!');
              navigate(role === 'admin' ? '/admin' : '/profile');
              return;
            }
          } else {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { name } }
            });
            if (!error && data.user) {
              toast.success('Registration successful! Please login.');
              setIsLogin(true);
              return;
            }
          }
        } catch (supaErr) {
          console.warn('Supabase auth failed, falling back to local:', supaErr);
        }
      }

      // Local API Fallback
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user && data.token) {
        setUser(data.user, data.token);
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
        navigate(data.user.role === 'admin' ? '/admin' : '/profile');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-zinc-500 text-center mb-10">{isLogin ? 'Enter your details to access your account' : 'Join our community of tech enthusiasts'}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-emerald-500/20 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400">Or continue with</span></div>
            </div>
            <button 
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
                if (error) toast.error(error.message);
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
          </div>
        )}

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-zinc-500 text-sm font-medium hover:text-emerald-500 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
