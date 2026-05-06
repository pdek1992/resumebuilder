'use client';

import { useState, useEffect } from 'react';
import ConsentModal from '@/components/ConsentModal';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Wand2, MessageSquare } from 'lucide-react';

export default function BuilderPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen font-bold">Loading Editor...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Please sign in to build your resume</h1>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <ConsentModal userId={user.id} />
      
      <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resume Builder</h1>
          <p className="text-slate-500">Edit your professional details below.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-100 transition-colors">
            <Wand2 className="w-4 h-4" /> AI Enhance
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md">
            <Download className="w-4 h-4" /> Download PDF (₹100)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Editor Side */}
        <div className="space-y-8 bg-white p-8 rounded-2xl border shadow-sm">
          <section className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" className="p-3 border rounded-lg bg-slate-50 focus:bg-white transition-colors" />
              <input type="text" placeholder="Last Name" className="p-3 border rounded-lg bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <input type="email" placeholder="Email Address" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white transition-colors" />
            <input type="tel" placeholder="Mobile Number" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white transition-colors" />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Experience</h2>
            <button className="w-full py-4 border-2 border-dashed rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-all">
              + Add Work Experience
            </button>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Paid Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <MessageSquare className="w-6 h-6 text-amber-600 mb-2" />
                <h4 className="font-bold">Mock Interview</h4>
                <p className="text-sm text-amber-700">Get 20 AI questions tailored to this resume.</p>
                <button className="mt-3 text-sm font-bold text-amber-900 underline">Unlock for ₹100</button>
              </div>
            </div>
          </section>
        </div>

        {/* Preview Side */}
        <div className="hidden lg:block sticky top-8 h-[calc(100vh-4rem)] bg-slate-200 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">
            Resume Preview Area
          </div>
        </div>
      </div>
    </div>
  );
}
