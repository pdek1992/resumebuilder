'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, Lock, Globe, Loader2 } from 'lucide-react';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const redirectUrl = `${window.location.origin}/builder`;

    try {
      if (mode === 'signup') {
        const { error } = method === 'email' 
          ? await supabase.auth.signUp({ 
              email, 
              password,
              options: { emailRedirectTo: redirectUrl }
            })
          : await supabase.auth.signUp({ 
              phone, 
              password,
              options: { emailRedirectTo: redirectUrl } // Also for phone if needed
            });
        
        if (error) throw error;
        setMessage('Check your email/phone for verification!');
      } else {
        const { error } = method === 'email'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signInWithPassword({ phone, password });
        
        if (error) throw error;
        window.location.reload(); 
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => initiateOAuth('google');
  const handleLinkedIn = () => initiateOAuth('linkedin_oidc');
  const handleGitHub = () => initiateOAuth('github');

  const initiateOAuth = async (provider: any) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/builder`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message.includes('provider is not enabled') 
        ? `The ${provider} login is not yet configured in the dashboard.`
        : 'Authentication service is temporarily unavailable.');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border shadow-xl">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-500">Secure access to your professional resumes</p>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-lg">
        <button 
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signin' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Sign In
        </button>
        <button 
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-600">
            Email Authentication
          </span>
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {message && <p className="text-sm font-medium text-center text-amber-600">{message}</p>}

        <button 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or SSO with</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={handleGoogle} className="p-3 border rounded-xl hover:bg-slate-50 transition-all flex justify-center">
          <Globe className="w-5 h-5 text-blue-500" />
        </button>
        <button onClick={handleLinkedIn} className="p-3 border rounded-xl hover:bg-slate-50 transition-all flex justify-center">
          <div className="w-5 h-5 bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold rounded-sm">in</div>
        </button>
        <button onClick={handleGitHub} className="p-3 border rounded-xl hover:bg-slate-50 transition-all flex justify-center">
          <div className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold rounded-full">GH</div>
        </button>
      </div>

      <p className="text-xs text-center text-slate-400 mt-6">
        Enterprise grade security with 256-bit encryption.
      </p>
    </div>
  );
}
