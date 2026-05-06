'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ConsentModal({ userId }: { userId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('consent_given')
        .eq('id', userId)
        .single();

      if (data && !data.consent_given) {
        setShow(true);
      }
    };
    if (userId) checkConsent();
  }, [userId]);

  const handleAccept = async () => {
    const { error } = await supabase
      .from('users')
      .update({ 
        consent_given: true, 
        consent_timestamp: new Date().toISOString() 
      })
      .eq('id', userId);

    if (!error) {
      setShow(false);
      // Log initial consent
      await fetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ userId, actionType: 'consent_given', prompt: 'LOG_ONLY' })
      });
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-2xl max-w-lg shadow-2xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Data Privacy & Consent</h2>
        <p className="text-slate-600 leading-relaxed">
          To provide AI-powered resume generation and secure payments, we collect your name, email, and resume data. 
          By clicking accept, you agree to our privacy policy and the DPDP Act (2023) guidelines for data processing.
        </p>
        <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
          <li>Purpose: Resume/Cover Letter generation & Payments</li>
          <li>Third Parties: Razorpay, OpenAI, Google Gemini, Supabase</li>
          <li>Data Retention: Until account deletion</li>
        </ul>
        <button 
          onClick={handleAccept}
          className="w-full py-4 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          I Accept & Agree
        </button>
      </div>
    </div>
  );
}
