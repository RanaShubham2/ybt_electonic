import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { Database, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [useLocalOnly, setUseLocalOnly] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkSupabaseConnection().then(setSupabaseConnected);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use the exported configuration check
      if (supabaseConnected && !useLocalOnly) {
        console.log('Attempting Supabase Authentication...');
        try {
          if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
              // If it's a "real" auth error from Supabase (wrong password, etc), show it
              if (error.message.includes('Invalid login credentials')) {
                // We still try local fallback for the demo admin or legacy users
                console.log('Supabase login failed (invalid credentials), trying local fallback...');
              } else {
                throw error;
              }
            } else if (data.user) {
              const role = data.user.email === 'admin@ybt.com' ? 'admin' : 'user';
              setUser({
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata.name || data.user.email!.split('@')[0],
                role: role
              }, (data.session as any)?.access_token);
              toast.success('Logged in via Supabase');
              navigate(role === 'admin' ? '/admin' : '/profile');
              return;
            }
          } else {
            console.log('Registering user with Supabase...');
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { 
                data: { name },
                emailRedirectTo: window.location.origin
              }
            });
            
            if (error) {
              if (error.message.includes('User already registered')) {
                toast.error('This email is already registered in Supabase.');
                setIsLoading(false);
                return;
              }
              throw error;
            }
            
            if (data.user) {
              if (data.session) {
                // Logged in immediately (email confirmation disabled)
                setUser({
                  id: data.user.id,
                  email: data.user.email!,
                  name: name || data.user.email!.split('@')[0],
                  role: 'user'
                }, data.session.access_token);
                toast.success('Account created and logged in (Supabase)!');
                navigate('/profile');
              } else {
                // Email confirmation required
                toast.success('Registration successful! Please check your email for a confirmation link.');
                setIsLogin(true);
              }
              setIsLoading(false);
              return;
            }
          }
        } catch (supaErr: any) {
          console.error('Supabase Auth Error:', supaErr.message);
          
          if (supaErr.message.includes('rate limit exceeded')) {
            // Informational toast instead of error toast
            toast('Supabase rate limit hit. Falling back to local database...', { icon: 'ℹ️' });
            console.log('Rate limit hit, falling back to local auth...');
          } else if (supaErr.message.includes('Email not confirmed')) {
            toast.error('Email not confirmed. Please check your inbox for a verification link or disable email confirmation in Supabase settings.', {
              duration: 6000,
            });
            setIsLoading(false);
            return; // Stop here, don't fall back to local if the user exists in Supabase but isn't confirmed
          } else if (supaErr.message.includes('apiKey') || supaErr.message.includes('url')) {
            toast.error('Supabase configuration error. Please check your keys.');
            setIsLoading(false);
            return;
          } else {
            // For other errors like "Invalid credentials", we just log it and fall back
            console.log('Supabase auth failed, trying local fallback...');
          }
        }
      }

      // Local API Fallback (only if Supabase is not connected or login failed)
      const isProduction = import.meta.env.PROD;
      if (isProduction && supabaseConnected) {
        // In production, if Supabase is connected but auth failed, don't try local
        throw new Error('Authentication failed. Please check your credentials.');
      }

      console.log('Attempting Local Authentication...');
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
      let errorMessage = err.message || 'Authentication failed';
      
      if (isLogin) {
        if (email === 'admin@ybt.com' && errorMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid credentials for admin. Use the "Reset" button below to restore the default password (admin123).';
        } else if (errorMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. If you recently switched to Supabase, you may need to create a new account there.';
        }
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-zinc-500 text-center mb-6">{isLogin ? 'Enter your details to access your account' : 'Join our community of tech enthusiasts'}</p>
        
        {supabaseConnected === true && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-600" />
              <p className="text-[10px] font-medium text-emerald-700">
                Supabase Cloud Auth is active.
              </p>
            </div>
            <button 
              onClick={() => setUseLocalOnly(!useLocalOnly)}
              className={cn(
                "px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-colors",
                useLocalOnly ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              )}
            >
              {useLocalOnly ? "Using Local" : "Use Local"}
            </button>
          </div>
        )}

        {supabaseConnected === false && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
            <Database className="w-5 h-5 text-yellow-600" />
            <p className="text-xs font-medium text-yellow-700">
              Supabase is not connected. Using local database fallback.
            </p>
          </div>
        )}

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

        {isLogin && (
          <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mb-2">Demo Admin Access</p>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-zinc-500">Email: <span className="text-zinc-900 dark:text-white font-mono">admin@ybt.com</span></span>
              <span className="text-zinc-500">Pass: <span className="text-zinc-900 dark:text-white font-mono">admin123</span></span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEmail('admin@ybt.com');
                  setPassword('admin123');
                }}
                className="flex-1 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Auto-fill
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/reset-admin', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                      toast.success('Admin user reset successfully!');
                      setEmail('admin@ybt.com');
                      setPassword('admin123');
                    } else {
                      toast.error(data.error || 'Reset failed');
                    }
                  } catch (err) {
                    toast.error('Failed to reset admin');
                  }
                }}
                className="px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                title="Force Reset Admin in Database"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
