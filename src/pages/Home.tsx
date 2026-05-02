import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../store/ResumeContext';
import { TEMPLATES } from '../utils/constants';
import {
  getTemplateDefinition,
  hasMeaningfulResumeData,
  readDraftUpdatedAt,
} from '../utils/resumeHelpers';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useResume();
  const [step, setStep] = useState(1);
  const [loginPhone, setLoginPhone] = useState(state.meta.userPhone || '');
  const [rawResumeText, setRawResumeText] = useState('');
  const [importState, setImportState] = useState<'idle' | 'file' | 'raw'>('idle');
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    setLoginPhone(state.meta.userPhone || '');
    setDraftUpdatedAt(readDraftUpdatedAt());
  }, [state.meta.userPhone]);

  const savedDraftAvailable = useMemo(() => hasMeaningfulResumeData(state), [state]);

  const handleParsedResume = async (rawText: string) => {
    if (!API_KEY) {
      alert('AI import is temporarily unavailable. You can continue manually.');
      return;
    }

    const { parseRawTextToResume } = await import('../services/ai');
    const parsedData = await parseRawTextToResume(rawText);
    dispatch({ type: 'MERGE_PARSED_DATA', payload: parsedData as any });
    setStep(2);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    setImportState('file');
    try {
      const file = event.target.files[0];
      const { parseResumeFile } = await import('../utils/fileParser');
      const rawText = await parseResumeFile(file);
      await handleParsedResume(rawText);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'We could not parse that resume file. Please try another file or paste the text manually.');
    } finally {
      setImportState('idle');
      event.target.value = '';
    }
  };

  const handleRawTextImport = async () => {
    if (!rawResumeText.trim()) {
      return;
    }

    setImportState('raw');
    try {
      await handleParsedResume(rawResumeText);
    } catch (error) {
      console.error(error);
      alert('We could not structure that text automatically. Please shorten it or continue manually.');
    } finally {
      setImportState('idle');
    }
  };

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    dispatch({ type: 'UPDATE_META', payload: { userPhone: loginPhone } });
    setStep(2);
  };

  const handleLogout = () => {
    if (!confirm('Clear the current resume draft from this browser session?')) {
      return;
    }

    dispatch({ type: 'RESET_STATE' });
    setLoginPhone('');
    setRawResumeText('');
    setDraftUpdatedAt(null);
    setStep(1);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateDefinition(templateId as any);
    dispatch({
      type: 'UPDATE_META',
      payload: {
        template: template.id,
        color: template.defaultColor,
      },
    });
    navigate('/builder');
  };

  const suggestedTemplates = useMemo(() => {
    const experienceLevel = state.meta.experienceLevel.toLowerCase();
    const industry = state.meta.industry.toLowerCase();

    if (experienceLevel === 'executive' || experienceLevel === 'senior') {
      return ['Executive', 'LuxuryGold', 'ClassicAcademic'];
    }

    if (industry === 'creative' || industry === 'marketing') {
      return ['Creative', 'Infographic', 'Startup'];
    }

    return ['MinimalATS', 'ModernProfessional', 'Hybrid'];
  }, [state.meta.experienceLevel, state.meta.industry]);

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.09),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white shadow-lg shadow-blue-200">
            R
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Premium Resume Builder
            </p>
            <h1 className="text-xl font-black tracking-tight">
              PREMIUM<span className="text-primary">AI</span>
            </h1>
          </div>
        </div>

        {state.meta.userPhone ? (
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-500 shadow-sm transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
          >
            Clear Draft
          </button>
        ) : null}
      </div>

      <div className="mx-auto mt-8 h-2.5 w-full max-w-4xl overflow-hidden rounded-full border border-white/80 bg-white/80 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-primary via-sky-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl">
        {step === 1 && (
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2.5rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">
                Start Faster
              </p>
              <h2 className="mt-4 text-5xl font-black tracking-tight text-slate-950">
                Build a premium resume from your existing file or from scratch.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
                Import from PDF, DOCX, or pasted raw text. Then edit every section, preview the
                chosen template, and continue the same draft from browser storage later.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                    Output
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">Template-locked PDF</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Preview and PDF stay aligned to the selected design instead of switching to a
                    fallback layout.
                  </p>
                </div>
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                    Recovery
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">Browser draft cache</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Keep the last edited resume in local storage and jump right back into the same
                    draft.
                  </p>
                </div>
              </div>

              {savedDraftAvailable ? (
                <div className="mt-8 rounded-[2rem] border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                        Saved Draft
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        Resume the last edited resume from this browser.
                      </p>
                      {draftUpdatedAt ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Last saved: {new Date(draftUpdatedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => navigate('/builder')}
                      className="rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
                    >
                      Resume Draft
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[2.5rem] border border-white/70 bg-white/95 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
              <form onSubmit={handleLoginSubmit} className="space-y-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-400">
                    Access
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                    Start a new draft
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(event) => setLoginPhone(event.target.value)}
                    placeholder="e.g. 9823340379"
                    className="w-full rounded-[1.5rem] border-2 border-transparent bg-slate-50 px-5 py-4 text-lg font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-primary hover:bg-blue-50/50">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="absolute inset-0 opacity-0"
                      onChange={handleFileUpload}
                      disabled={importState !== 'idle'}
                    />
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      📄
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">
                      {importState === 'file' ? 'Importing Resume...' : 'Upload PDF / DOCX'}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Auto-populate fields
                    </p>
                  </label>

                  <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                      Paste Raw Text
                    </p>
                    <textarea
                      value={rawResumeText}
                      onChange={(event) => setRawResumeText(event.target.value)}
                      placeholder="Paste plain resume text here if you copied it from another source."
                      className="mt-3 h-28 w-full resize-none rounded-[1.5rem] border-2 border-transparent bg-white px-4 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleRawTextImport}
                      disabled={importState !== 'idle' || !rawResumeText.trim()}
                      className="mt-4 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {importState === 'raw' ? 'Structuring Text...' : 'Import Pasted Text'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Manual Entry
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Prefer to type everything yourself? Continue and fill each section manually in
                    the editor.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-[1.75rem] bg-primary px-6 py-5 text-sm font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
                >
                  Continue
                </button>
              </form>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-3xl rounded-[2.75rem] border border-white/80 bg-white/95 p-8 shadow-2xl shadow-slate-200/60">
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">
                Personalization
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Tell the builder what kind of role you are targeting.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-500">
                These details improve template recommendations, AI rewriting, and section emphasis.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setStep(3);
              }}
              className="space-y-7"
            >
              <div className="space-y-3">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  Target Role
                </label>
                <input
                  type="text"
                  required
                  value={state.meta.targetRole}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_META', payload: { targetRole: event.target.value } })
                  }
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-[1.5rem] border-2 border-transparent bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Experience Level
                  </label>
                  <select
                    value={state.meta.experienceLevel}
                    onChange={(event) =>
                      dispatch({
                        type: 'UPDATE_META',
                        payload: { experienceLevel: event.target.value },
                      })
                    }
                    className="w-full rounded-[1.5rem] border-2 border-transparent bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                    required
                  >
                    <option value="fresher">Fresher (0-2y)</option>
                    <option value="mid">Mid-Level (2-5y)</option>
                    <option value="senior">Senior (5-10y)</option>
                    <option value="executive">Executive (10y+)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Industry
                  </label>
                  <select
                    value={state.meta.industry}
                    onChange={(event) =>
                      dispatch({ type: 'UPDATE_META', payload: { industry: event.target.value } })
                    }
                    className="w-full rounded-[1.5rem] border-2 border-transparent bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                    required
                  >
                    <option value="tech">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="creative">Creative</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  Job Description for AI Tailoring
                </label>
                <textarea
                  value={state.meta.jobDescription}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_META',
                      payload: { jobDescription: event.target.value },
                    })
                  }
                  placeholder="Paste the job description here to tailor bullets and summary later."
                  className="h-40 w-full resize-none rounded-[1.75rem] border-2 border-transparent bg-slate-50 px-5 py-4 font-medium leading-7 text-slate-700 outline-none transition focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-primary hover:text-primary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[1.6] rounded-[1.5rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
                >
                  Continue to Templates
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">
                Template Selection
              </p>
              <h2 className="mt-4 text-5xl font-black tracking-tight text-slate-950">
                Choose the design your final PDF should follow.
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-500">
                These are full visual previews, not placeholders. Pick the style you want and the
                editor will keep the preview and exported PDF aligned to that family.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`group overflow-hidden rounded-[2.5rem] border-4 bg-white text-left shadow-xl shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-2xl ${
                    state.meta.template === template.id
                      ? 'border-primary'
                      : 'border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="relative aspect-[1/1.32] overflow-hidden bg-slate-100">
                    <img
                      src={template.image}
                      alt={`${template.name} template preview`}
                      className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full bg-white/95 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
                        Use This
                      </span>
                      {suggestedTemplates.includes(template.id) ? (
                        <span className="rounded-full bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-black text-slate-900">{template.name}</h3>
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: template.defaultColor }}
                      />
                    </div>
                    <p className="text-sm leading-6 text-slate-500">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-primary hover:text-primary"
              >
                Back to Goals
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
