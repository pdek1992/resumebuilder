'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, Lock, Chrome, Loader2 } from 'lucide-react';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = method === 'email' 
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signUp({ phone, password });
        
        if (error) throw error;
        setMessage('Check your email/phone for verification!');
      } else {
        const { error } = method === 'email'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signInWithPassword({ phone, password });
        
        if (error) throw error;
        window.location.reload(); // Refresh to update user state
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/builder`
      }
    });
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
        <div className="flex gap-4 mb-2">
          <button 
            type="button"
            onClick={() => setMethod('email')}
            className={`text-xs font-bold px-3 py-1 rounded-full border ${method === 'email' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-400'}`}
          >
            Email
          </button>
          <button 
            type="button"
            onClick={() => setMethod('phone')}
            className={`text-xs font-bold px-3 py-1 rounded-full border ${method === 'phone' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-400'}`}
          >
            Mobile No
          </button>
        </div>

        {method === 'email' ? (
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
        ) : (
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="tel" 
              placeholder="Mobile Number (+91...)" 
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        )}

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

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or continue with</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button 
        onClick={handleGoogle}
        className="w-full py-3 border-2 border-slate-200 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
      >
        <Chrome className="w-5 h-5 text-blue-500" />
        Google SSO
      </button>

      <p className="text-xs text-center text-slate-400 mt-6">
        Secure authentication powered by Supabase.
      </p>
    </div>
  );
}
