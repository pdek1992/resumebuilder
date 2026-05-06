'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Users, CreditCard, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, payments: 0, resumes: 0 });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (data?.is_admin) setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Checking credentials...</div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600 space-y-4">
        <ShieldCheck className="w-16 h-16" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p>You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" /> Admin Dashboard
        </h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">Authorized</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border shadow-sm">
          <Users className="w-8 h-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Users</h3>
          <p className="text-4xl font-bold">--</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border shadow-sm">
          <CreditCard className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Revenue (INR)</h3>
          <p className="text-4xl font-bold">--</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border shadow-sm">
          <ShieldCheck className="w-8 h-8 text-amber-400 mb-2" />
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Payments</h3>
          <p className="text-4xl font-bold">--</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-slate-50 font-bold">Recent Access Logs</div>
        <div className="p-12 text-center text-slate-400 italic">
          Fetching audit trail from Supabase...
        </div>
      </div>
    </div>
  );
}
