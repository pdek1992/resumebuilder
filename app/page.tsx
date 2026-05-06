import Link from 'next/link';
import { FileText, Rocket, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Build Your Career with <span className="text-blue-600">AI Precision</span>
        </h1>
        <p className="text-xl text-slate-600">
          Professional resumes, cover letters, and mock interviews. All-in-one platform optimized for the DPDP Act and modern ATS.
        </p>
        
        <div className="grid grid-cols-1 gap-6 mt-12 sm:grid-cols-2">
          <div className="p-6 text-left bg-white border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <Zap className="w-10 h-10 mb-4 text-amber-500" />
            <h3 className="text-lg font-bold">AI Resume Builder</h3>
            <p className="text-slate-500">Generate professional sections tailored to your target job role instantly.</p>
          </div>
          <div className="p-6 text-left bg-white border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <ShieldCheck className="w-10 h-10 mb-4 text-green-500" />
            <h3 className="text-lg font-bold">DPDP Compliant</h3>
            <p className="text-slate-500">Your data is yours. Secure, transparent, and easy to delete anytime.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 pt-8">
          <Link 
            href="/builder" 
            className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
          >
            Create Your Resume Now
          </Link>
          <p className="text-sm text-slate-400">Unlock full access for 24 hours at just ₹100</p>
        </div>
      </div>
    </div>
  );
}
