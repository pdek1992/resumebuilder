'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Sparkles, 
  Award, 
  CheckCircle2,
  ChevronRight,
  Star
} from 'lucide-react';

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-200">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI RESUME PRO
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          </div>

          <Link 
            href="/builder" 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
            Create My Resume
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-sm font-bold animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen AI Resume Generation</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
              Land Your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">Dream Job</span> With AI.
            </h1>
            
            <p className="text-xl text-slate-500 leading-relaxed max-w-xl">
              Build a professional, ATS-optimized resume in 2 minutes. Our AI tailors your experience to matching job descriptions automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/builder" 
                className="group px-8 py-5 bg-blue-600 text-white rounded-2xl text-lg font-black hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Build My Resume <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 px-6 py-4 bg-white border border-slate-200 rounded-2xl">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                      U{i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex text-amber-400 w-4 h-4 gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} fill="currentColor" />)}
                  </div>
                  <p className="text-xs font-bold text-slate-500">10k+ Users Trust Us</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[3rem] blur-3xl opacity-10"></div>
            <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden group">
              {/* Dummy Resume Preview */}
              <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-100 w-1/2 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-50 w-full rounded-md"></div>
                  <div className="h-4 bg-slate-50 w-5/6 rounded-md"></div>
                </div>
                <div className="h-32 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
                    <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
                    <div>
                      <p className="text-xs font-bold text-blue-600">Analyzing Job Description...</p>
                      <div className="w-32 h-1.5 bg-blue-100 rounded-full mt-1 overflow-hidden">
                        <div className="w-2/3 h-full bg-blue-600"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-slate-50 rounded-xl"></div>
                  <div className="h-20 bg-slate-50 rounded-xl"></div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href="/builder" className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold">Live Preview</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Everything You Need To <span className="text-blue-600">Succeed.</span></h2>
            <p className="text-slate-500 font-medium">Built by recruitment experts and AI engineers to give you an unfair advantage.</p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Sparkles, title: "AI Optimization", desc: "Our Gemini-powered engine rewrites bullet points for maximum impact.", color: "blue" },
              { icon: Award, title: "ATS Friendly", desc: "100% compliant templates that pass through any screening system.", color: "indigo" },
              { icon: Zap, title: "Instant Generate", desc: "Get a custom cover letter and JD-tailored resume in seconds.", color: "amber" },
              { icon: ShieldCheck, title: "Secure & Private", desc: "DPDP compliant data handling with full user encryption.", color: "green" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={item}
                className="p-8 bg-slate-50 rounded-[2rem] border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- TRUST SECTION --- */}
      <section className="py-16 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Trusted by job seekers at</h3>
            <p className="text-slate-400 text-sm">Fortune 500 companies worldwide</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale invert">
            <span className="text-2xl font-black">GOOGLE</span>
            <span className="text-2xl font-black">AMAZON</span>
            <span className="text-2xl font-black">META</span>
            <span className="text-2xl font-black">NETFLIX</span>
            <span className="text-2xl font-black">APPLE</span>
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center text-white shadow-2xl shadow-blue-200">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl md:text-6xl font-black leading-tight">Ready To Level Up Your <br className="hidden md:block" /> Career Today?</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join 10,000+ professionals who have already secured interviews at top tech companies.
            </p>
            <Link 
              href="/builder" 
              className="inline-flex items-center gap-3 px-10 py-6 bg-white text-blue-600 rounded-3xl text-xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-900/20"
            >
              Get Started For Free <ChevronRight />
            </Link>
            <div className="flex justify-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-100">
                <CheckCircle2 className="w-5 h-5" /> No Credit Card Required
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-blue-100">
                <CheckCircle2 className="w-5 h-5" /> AI Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <FileText className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              AI RESUME PRO
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            © 2026 AI Resume Pro. All rights reserved. Built with Next.js & Supabase.
          </p>
          <div className="flex gap-6 text-slate-400 text-sm font-bold">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
