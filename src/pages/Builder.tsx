import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import { verifyPassword } from '../services/crypto';
import { useResume, type ResumeState } from '../store/ResumeContext';
import {
  AI_ERROR_CODES,
  COLOR_SWATCHES,
  FONT_PRESETS,
  PAYMENT_QR,
  PRICE_BASIC,
  TEMPLATES,
  WHATSAPP_NO,
  type TemplateId,
} from '../utils/constants';
import {
  buildResumeFileName,
  createId,
  createPaidResumeState,
  getTemplateDefinition,
} from '../utils/resumeHelpers';

type EditorTab = 'personal' | 'experience' | 'education' | 'skills' | 'more';

type AiProposal =
  | {
      label: string;
      original: string;
      suggestion: string;
      target: { type: 'summary' };
    }
  | {
      label: string;
      original: string;
      suggestion: string;
      target: { type: 'experience'; id: string };
    }
  | {
      label: string;
      original: string;
      suggestion: string;
      target: { type: 'project'; id: string };
    };

const tabs: EditorTab[] = ['personal', 'experience', 'education', 'skills', 'more'];

const fieldClass =
  'w-full rounded-[1.35rem] border-2 border-transparent bg-slate-50 px-4 py-3.5 font-medium text-slate-800 outline-none transition focus:border-primary focus:bg-white';

const labelClass =
  'ml-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400';

const sectionCardClass =
  'rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100';

const handleAutoBullet = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  onChange: (value: string) => void,
) => {
  if (event.key === 'Enter') {
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    // Only add bullet if the current line already starts with one or is empty and we want to start a list
    // Or just always add it if it's a list-heavy field. 
    // The user asked for "at new enter add new bullet pointer"
    event.preventDefault();
    const bullet = '• ';
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    
    const newValue = `${before}\n${bullet}${after}`;
    onChange(newValue);
    
    // Set cursor position after the new bullet
    setTimeout(() => {
      const textarea = event.target as HTMLTextAreaElement;
      textarea.selectionStart = textarea.selectionEnd = selectionStart + bullet.length + 1;
    }, 0);
  }
};

const Builder: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useResume();
  const deferredState = useDeferredValue(state);

  const [activeTab, setActiveTab] = useState<EditorTab>('personal');
  const [showPayment, setShowPayment] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [pendingTailoredResume, setPendingTailoredResume] = useState<Partial<ResumeState> | null>(
    null,
  );
  const [aiProposal, setAiProposal] = useState<AiProposal | null>(null);
  const [aiBusyKey, setAiBusyKey] = useState<string | null>(null);
  const [showPhoneError, setShowPhoneError] = useState(false);

  const previewSynced = deferredState === state;
  const template = useMemo(
    () => getTemplateDefinition(state.meta.template),
    [state.meta.template],
  );

  useEffect(() => {
    if (!state.meta.userPhone) {
      navigate('/');
    }
  }, [navigate, state.meta.userPhone]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.meta.isPaid && (event.ctrlKey || event.metaKey) && ['p', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        alert('Export is only available after payment and unlock.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.meta.isPaid]);

  const requestTextEnhancement = async (
    target: AiProposal['target'],
    label: string,
    value: string,
  ) => {
    const busyKey = `${target.type}:${'id' in target ? target.id : 'summary'}`;
    setAiBusyKey(busyKey);
    try {
      const { enhanceBulletPoint } = await import('../services/ai');
      const suggestion = await enhanceBulletPoint(value);
      
      if (target.type === 'summary') {
        setAiProposal({
          label,
          original: value,
          suggestion,
          target: { type: 'summary' },
        });
      } else if (target.type === 'experience') {
        setAiProposal({
          label,
          original: value,
          suggestion,
          target: { type: 'experience', id: target.id },
        });
      } else {
        setAiProposal({
          label,
          original: value,
          suggestion,
          target: { type: 'project', id: target.id },
        });
      }
    } catch (error: any) {
      console.error(error);
      const errorCode = parseInt(error.message, 10);
      const message = AI_ERROR_CODES[errorCode] || 'AI service is temporarily unavailable. Error code: 104';
      alert(message);
    } finally {
      setAiBusyKey(null);
    }
  };

  const applyAiProposal = () => {
    if (!aiProposal) {
      return;
    }

    if (aiProposal.target.type === 'summary') {
      dispatch({ type: 'UPDATE_SUMMARY', payload: aiProposal.suggestion });
    }

    if (aiProposal.target.type === 'experience') {
      dispatch({
        type: 'UPDATE_EXPERIENCE',
        payload: { id: aiProposal.target.id, data: { description: aiProposal.suggestion } },
      });
    }

    if (aiProposal.target.type === 'project') {
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { id: aiProposal.target.id, data: { description: aiProposal.suggestion } },
      });
    }

    setAiProposal(null);
  };

  const handleTailorResume = async () => {
    if (!state.meta.jobDescription.trim()) {
      alert('Add a job description first so AI can tailor the resume.');
      return;
    }

    setIsTailoring(true);
    try {
      const { tailorResumeToJD } = await import('../services/ai');
      const tailored = await tailorResumeToJD(state, state.meta.jobDescription);
      setPendingTailoredResume(tailored);
    } catch (error: any) {
      console.error(error);
      const errorCode = parseInt(error.message, 10);
      const message = AI_ERROR_CODES[errorCode] || 'AI service is temporarily unavailable. Error code: 104';
      alert(message);
    } finally {
      setIsTailoring(false);
      setShowTailorModal(false);
    }
  };

  const startPaymentFlow = async () => {
    if (!state.personalInfo.phone.trim()) {
      setActiveTab('personal');
      setShowPhoneError(true);
      alert('Please enter your mobile number before downloading.');
      return;
    }
    setShowPhoneError(false);

    // Check 24-hour cache
    const unlockedUntil = localStorage.getItem('unlocked_until');
    if (unlockedUntil && parseInt(unlockedUntil, 10) > Date.now()) {
      // Already unlocked within last 24h
      setIsGeneratingDownload(true);
      try {
        await triggerDownload();
      } catch (error: any) {
        console.error('PDF DOWNLOAD ERROR:', error);
        const errorMsg = error?.message || 'Unknown rendering error';
        alert(`The PDF could not be generated. Technical Error: ${errorMsg}. This often happens due to incompatible text symbols or a very large photo. If it persists, try removing your photo or simplifying sections with special characters.`);
      } finally {
        setIsGeneratingDownload(false);
      }
      return;
    }

    let currentTxnHash = state.meta.txnHash;
    let needsNewHash = !currentTxnHash || !currentTxnHash.includes('-');
    
    if (!needsNewHash && currentTxnHash) {
      const parts = currentTxnHash.split('-');
      const timestampStr = parts[0];
      const timestamp = parseInt(timestampStr, 10);
      // If older than 5 minutes, regenerate
      if (isNaN(timestamp) || Date.now() - timestamp > 5 * 60 * 1000) {
        needsNewHash = true;
      }
    }

    if (needsNewHash) {
      const randomPart = createId('TXN').replace('TXN_', '').toUpperCase();
      currentTxnHash = `${Date.now()}-${randomPart}`;
      dispatch({ type: 'UPDATE_META', payload: { txnHash: currentTxnHash } });
    }
    setShowPayment(true);
  };

  const triggerDownload = async () => {
    try {
      const paidState = createPaidResumeState(state);
      const fileName = buildResumeFileName(state);
      const [{ pdf }, { default: ResumePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/ResumePDF'),
      ]);
      
      // Use toBlob() with specific error handling
      const blob = await pdf(<ResumePDF data={paidState} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error('CRITICAL PDF FAILURE:', error);
      throw error;
    }
  };

  const handleUnlock = async () => {
    if (!verifyPassword(state.meta.userPhone, state.meta.txnHash, unlockPassword)) {
      alert('That unlock code is not valid.');
      return;
    }

    // Set 24h cache
    localStorage.setItem('unlocked_until', (Date.now() + 24 * 60 * 60 * 1000).toString());

    setIsGeneratingDownload(true);
    try {
      await triggerDownload();
      setShowUnlock(false);
      setUnlockPassword('');
    } catch (error: any) {
      console.error('PDF DOWNLOAD ERROR:', error);
      const errorMsg = error?.message || 'Unknown rendering error';
      alert(`The PDF could not be generated. Technical Error: ${errorMsg}. This often happens due to incompatible text symbols or a very large photo. If it persists, try removing your photo or simplifying sections with special characters.`);
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    const selectedTemplate = getTemplateDefinition(templateId);
    dispatch({
      type: 'UPDATE_META',
      payload: {
        template: selectedTemplate.id,
        color: selectedTemplate.defaultColor,
      },
    });
    setShowTemplateGallery(false);
  };

  const handleLogout = () => {
    if (!confirm('Clear this resume draft from the browser and return home?')) {
      return;
    }

    localStorage.removeItem('unlocked_until');
    dispatch({ type: 'RESET_STATE' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-blue-200">
                R
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Premium Resume
                </p>
                <p className="text-lg font-black tracking-tight">
                  PREMIUM<span className="text-primary">AI</span>
                </p>
              </div>
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-2 md:flex">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  previewSynced ? 'bg-emerald-500' : 'animate-pulse bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                {previewSynced ? 'Preview Synced' : 'Updating Live Preview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-2.5 lg:flex">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Score
              </span>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${state.analysis.score}%` }}
                />
              </div>
              <span className="text-sm font-black text-slate-700">{state.analysis.score}%</span>
            </div>

            <button
              onClick={() => setShowTemplateGallery(true)}
              className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-slate-600 transition hover:border-primary hover:text-primary"
            >
              Switch Style
            </button>

            <button
              onClick={() => setShowTailorModal(true)}
              className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-slate-600 transition hover:border-primary hover:text-primary"
            >
              AI Tailor
            </button>

            <button
              onClick={startPaymentFlow}
              disabled={isGeneratingDownload}
              className="rounded-[1.2rem] bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingDownload ? 'Preparing PDF...' : 'Download PDF'}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-slate-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.82fr)]">
        <section className="min-h-[calc(100vh-10rem)] overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-200/50">
          <div className="border-b border-slate-100 px-6 pt-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.22em] transition ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-lg shadow-blue-100'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Editing Focus
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The active editor section is emphasized in the live preview so users can see the
                  exact area they are changing.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Current Template
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">{template.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{template.description}</p>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-16rem)] overflow-y-auto px-6 pb-8 pt-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className={sectionCardClass}>
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50">
                        {state.personalInfo.profileImage ? (
                          <img
                            src={state.personalInfo.profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">📷</div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = (loadEvent) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;
                                const max = 400;

                                if (width > height && width > max) {
                                  height *= max / width;
                                  width = max;
                                } else if (height > max) {
                                  width *= max / height;
                                  height = max;
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                
                                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                                dispatch({
                                  type: 'UPDATE_PERSONAL_INFO',
                                  payload: { profileImage: compressedBase64 },
                                });
                              };
                              img.src = loadEvent.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                        Profile Photo
                      </p>
                    </div>

                    <div className="grid flex-1 gap-4 md:grid-cols-2">
                      {[
                        ['Full Name', 'fullName', 'text'],
                        ['Email Address', 'email', 'email'],
                        ['Phone Number', 'phone', 'text'],
                        ['Location', 'location', 'text'],
                        ['LinkedIn URL', 'linkedin', 'text'],
                        ['Portfolio / Website', 'portfolio', 'text'],
                      ].map(([label, name, type]) => (
                        <div key={name} className="space-y-2">
                          <label className={labelClass}>
                            {label} {name === 'phone' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={type}
                            name={name}
                            value={(state.personalInfo as any)[name]}
                            onChange={(event) => {
                              if (name === 'phone' && event.target.value.trim()) setShowPhoneError(false);
                              dispatch({
                                type: 'UPDATE_PERSONAL_INFO',
                                payload: { [name]: event.target.value },
                              });
                            }}
                            className={`${fieldClass} ${name === 'phone' && showPhoneError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={sectionCardClass}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <label className={labelClass}>Professional Summary</label>
                      <p className="mt-2 text-sm text-slate-500">
                        This appears prominently in the preview and final PDF.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        requestTextEnhancement(
                          { type: 'summary' },
                          'professional summary',
                          state.summary,
                        )
                      }
                      disabled={aiBusyKey === 'summary:summary'}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary transition hover:border-primary disabled:opacity-50"
                    >
                      {aiBusyKey === 'summary:summary' ? 'Generating...' : 'AI Improve'}
                    </button>
                  </div>
                  <textarea
                    value={state.summary}
                    onKeyDown={(e) => handleAutoBullet(e, (v) => dispatch({ type: 'UPDATE_SUMMARY', payload: v }))}
                    onChange={(event) =>
                      dispatch({ type: 'UPDATE_SUMMARY', payload: event.target.value })
                    }
                    className={`${fieldClass} min-h-44 resize-none px-5 py-4 leading-7`}
                    placeholder="Summarize your profile. Press Enter to start a bulleted list."
                  />
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-5">
                {state.experience.map((experience) => (
                  <div key={experience.id} className={sectionCardClass}>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {experience.role || 'New Experience'}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                          Experience Block
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({ type: 'DELETE_EXPERIENCE', payload: experience.id })
                        }
                        className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={labelClass}>Company</label>
                        <input
                          className={fieldClass}
                          value={experience.company}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EXPERIENCE',
                              payload: {
                                id: experience.id,
                                data: { company: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Role</label>
                        <input
                          className={fieldClass}
                          value={experience.role}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EXPERIENCE',
                              payload: { id: experience.id, data: { role: event.target.value } },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Start Date</label>
                        <input
                          className={fieldClass}
                          placeholder="Jan 2022"
                          value={experience.startDate}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EXPERIENCE',
                              payload: {
                                id: experience.id,
                                data: { startDate: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className={labelClass}>End Date</label>
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={experience.isCurrent}
                              onChange={(event) =>
                                dispatch({
                                  type: 'UPDATE_EXPERIENCE',
                                  payload: {
                                    id: experience.id,
                                    data: {
                                      isCurrent: event.target.checked,
                                      endDate: event.target.checked ? '' : experience.endDate,
                                    },
                                  },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary"
                            />
                            Current
                          </label>
                        </div>
                        <input
                          className={fieldClass}
                          placeholder="Present"
                          value={experience.isCurrent ? 'Present' : experience.endDate}
                          disabled={experience.isCurrent}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EXPERIENCE',
                              payload: {
                                id: experience.id,
                                data: { endDate: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <label className={labelClass}>Impact Bullets</label>
                        <button
                          onClick={() =>
                            requestTextEnhancement(
                              { type: 'experience', id: experience.id },
                              'experience bullets',
                              experience.description,
                            )
                          }
                          disabled={aiBusyKey === `experience:${experience.id}`}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary transition hover:border-primary disabled:opacity-50"
                        >
                          {aiBusyKey === `experience:${experience.id}`
                            ? 'Generating...'
                            : 'AI Improve'}
                        </button>
                      </div>
                      <textarea
                        className={`${fieldClass} min-h-44 resize-none px-5 py-4 leading-7`}
                        value={experience.description}
                        onKeyDown={(e) => handleAutoBullet(e, (v) => 
                          dispatch({
                            type: 'UPDATE_EXPERIENCE',
                            payload: { id: experience.id, data: { description: v } },
                          })
                        )}
                        onChange={(event) =>
                          dispatch({
                            type: 'UPDATE_EXPERIENCE',
                            payload: {
                              id: experience.id,
                              data: { description: event.target.value },
                            },
                          })
                        }
                        placeholder="One bullet per line. Press Enter for next bullet."
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    dispatch({
                      type: 'ADD_EXPERIENCE',
                      payload: {
                        id: createId('exp'),
                        company: '',
                        role: '',
                        startDate: '',
                        endDate: '',
                        isCurrent: false,
                        description: '',
                      },
                    })
                  }
                  className="w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 text-xs font-black uppercase tracking-[0.25em] text-slate-500 transition hover:border-primary hover:bg-blue-50/50 hover:text-primary"
                >
                  Add Experience
                </button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-5">
                {state.education.map((education) => (
                  <div key={education.id} className={sectionCardClass}>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {education.degree || 'New Education'}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                          Education Block
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({ type: 'DELETE_EDUCATION', payload: education.id })
                        }
                        className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClass}>Institution</label>
                        <input
                          className={fieldClass}
                          value={education.institution}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EDUCATION',
                              payload: {
                                id: education.id,
                                data: { institution: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClass}>Degree / Course</label>
                        <input
                          className={fieldClass}
                          value={education.degree}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EDUCATION',
                              payload: { id: education.id, data: { degree: event.target.value } },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Start Year</label>
                        <input
                          className={fieldClass}
                          value={education.startDate}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EDUCATION',
                              payload: {
                                id: education.id,
                                data: { startDate: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>End Year</label>
                        <input
                          className={fieldClass}
                          value={education.endDate}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EDUCATION',
                              payload: {
                                id: education.id,
                                data: { endDate: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Score</label>
                        <input
                          className={fieldClass}
                          value={education.score}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_EDUCATION',
                              payload: { id: education.id, data: { score: event.target.value } },
                            })
                          }
                          placeholder="8.5 CGPA / 85%"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    dispatch({
                      type: 'ADD_EDUCATION',
                      payload: {
                        id: createId('edu'),
                        institution: '',
                        degree: '',
                        startDate: '',
                        endDate: '',
                        score: '',
                      },
                    })
                  }
                  className="w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 text-xs font-black uppercase tracking-[0.25em] text-slate-500 transition hover:border-primary hover:bg-blue-50/50 hover:text-primary"
                >
                  Add Education
                </button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className={sectionCardClass}>
                  <div className="space-y-3">
                    <label className={labelClass}>Technical Skills</label>
                    <textarea
                      className={`${fieldClass} min-h-44 resize-none px-5 py-4 leading-7`}
                      placeholder="React, TypeScript, Node.js, System Design, AWS"
                      value={state.skills.join(', ')}
                      onChange={(event) =>
                        dispatch({
                          type: 'SET_SKILLS',
                          payload: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>

                <div className={sectionCardClass}>
                  <div className="space-y-3">
                    <label className={labelClass}>Languages Known</label>
                    <textarea
                      className={`${fieldClass} min-h-32 resize-none px-5 py-4 leading-7`}
                      placeholder="English (Fluent), Hindi (Native)"
                      value={state.languages.join(', ')}
                      onChange={(event) =>
                        dispatch({
                          type: 'SET_LANGUAGES',
                          payload: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'more' && (
              <div className="space-y-6">
                <div className={sectionCardClass}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">Projects</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                        Highlight relevant work
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'ADD_PROJECT',
                          payload: {
                            id: createId('project'),
                            name: '',
                            description: '',
                            link: '',
                          },
                        })
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary"
                    >
                      Add Project
                    </button>
                  </div>

                  <div className="space-y-4">
                    {state.projects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <p className="text-sm font-black text-slate-900">
                            {project.name || 'New Project'}
                          </p>
                          <button
                            onClick={() =>
                              dispatch({ type: 'DELETE_PROJECT', payload: project.id })
                            }
                            className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-500"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <label className={labelClass}>Project Name</label>
                            <input
                              className={fieldClass}
                              value={project.name}
                              onChange={(event) =>
                                dispatch({
                                  type: 'UPDATE_PROJECT',
                                  payload: { id: project.id, data: { name: event.target.value } },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center justify-between gap-4">
                              <label className={labelClass}>Description</label>
                              <button
                                onClick={() =>
                                  requestTextEnhancement(
                                    { type: 'project', id: project.id },
                                    'project description',
                                    project.description,
                                  )
                                }
                                disabled={aiBusyKey === `project:${project.id}`}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary transition hover:border-primary disabled:opacity-50"
                              >
                                {aiBusyKey === `project:${project.id}`
                                  ? 'Generating...'
                                  : 'AI Improve'}
                              </button>
                            </div>
                            <textarea
                              className={`${fieldClass} min-h-32 resize-none px-5 py-4 leading-7`}
                              value={project.description}
                              onKeyDown={(e) => handleAutoBullet(e, (v) => 
                                dispatch({
                                  type: 'UPDATE_PROJECT',
                                  payload: { id: project.id, data: { description: v } },
                                })
                              )}
                              onChange={(event) =>
                                dispatch({
                                  type: 'UPDATE_PROJECT',
                                  payload: {
                                    id: project.id,
                                    data: { description: event.target.value },
                                  },
                                })
                              }
                              placeholder="Project details. Press Enter for next bullet."
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className={labelClass}>Project Link</label>
                            <input
                              className={fieldClass}
                              value={project.link}
                              onChange={(event) =>
                                dispatch({
                                  type: 'UPDATE_PROJECT',
                                  payload: { id: project.id, data: { link: event.target.value } },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={sectionCardClass}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">Certifications</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                        Keep supporting proof concise
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'ADD_CERTIFICATION',
                          payload: {
                            id: createId('cert'),
                            name: '',
                            issuer: '',
                            date: '',
                          },
                        })
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary"
                    >
                      Add Certification
                    </button>
                  </div>

                  <div className="space-y-4">
                    {state.certifications.map((certification) => (
                      <div
                        key={certification.id}
                        className="grid gap-4 rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4 md:grid-cols-3"
                      >
                        <div className="space-y-2 md:col-span-2">
                          <label className={labelClass}>Certification Name</label>
                          <input
                            className={fieldClass}
                            value={certification.name}
                            onChange={(event) =>
                              dispatch({
                                type: 'UPDATE_CERTIFICATION',
                                payload: {
                                  id: certification.id,
                                  data: { name: event.target.value },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            onClick={() =>
                              dispatch({
                                type: 'DELETE_CERTIFICATION',
                                payload: certification.id,
                              })
                            }
                            className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Issuer</label>
                          <input
                            className={fieldClass}
                            value={certification.issuer}
                            onChange={(event) =>
                              dispatch({
                                type: 'UPDATE_CERTIFICATION',
                                payload: {
                                  id: certification.id,
                                  data: { issuer: event.target.value },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Date</label>
                          <input
                            className={fieldClass}
                            value={certification.date}
                            onChange={(event) =>
                              dispatch({
                                type: 'UPDATE_CERTIFICATION',
                                payload: {
                                  id: certification.id,
                                  data: { date: event.target.value },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* GLOBAL DESIGN CONTROLS (Below Section Data) */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className={sectionCardClass}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className={labelClass}>Accent Color</label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {COLOR_SWATCHES.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            dispatch({ type: 'UPDATE_META', payload: { color } })
                          }
                          className={`h-10 w-10 rounded-full border-4 transition ${
                            state.meta.color === color ? 'border-slate-900' : 'border-white'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        Custom
                        <input
                          type="color"
                          value={state.meta.color}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_META',
                              payload: { color: event.target.value },
                            })
                          }
                          className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Font Mood</label>
                    <div className="mt-4 grid gap-3">
                      {FONT_PRESETS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() =>
                            dispatch({ type: 'UPDATE_META', payload: { font: font.id } })
                          }
                          className={`flex items-center justify-between rounded-[1.2rem] border px-4 py-3 text-sm font-bold transition ${
                            state.meta.font === font.id
                              ? 'border-primary bg-blue-50 text-primary'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{font.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.24em]">
                            {font.id.replace('-Roman', '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)]">
          <div className="rounded-[2.3rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-200/50">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Live Preview
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  {template.name}
                </h2>
              </div>
              <div
                className="rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em]"
                style={{
                  color: previewSynced ? '#047857' : '#b45309',
                  backgroundColor: previewSynced ? '#d1fae5' : '#fef3c7',
                }}
              >
                {previewSynced ? 'Synced' : 'Refreshing'}
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-100 p-3">
              <ResumePreview data={deferredState} activeSection={activeTab} />
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Export Quality
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The preview updates from the current builder state while the downloadable PDF is
                generated only after a valid unlock. That removes the old stuck “PDF generation in
                progress” state and reduces unpaid export bypasses.
              </p>
            </div>

            {!!state.analysis.missingSections.length && (
              <div className="mt-4 rounded-[1.6rem] border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
                  Missing Sections
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {state.analysis.missingSections.join(', ')}
                </p>
              </div>
            )}

            {!!state.analysis.suggestions.length && (
              <div className="mt-4 rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
                  Suggestions
                </p>
                <div className="mt-2 space-y-2 text-sm leading-6 text-emerald-900">
                  {state.analysis.suggestions.map((suggestion) => (
                    <p key={suggestion}>{suggestion}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {showTemplateGallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2.8rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                  Template Gallery
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Select the exact resume style you want to export.
                </h2>
              </div>
              <button
                onClick={() => setShowTemplateGallery(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-slate-500 transition hover:border-slate-300"
              >
                Close
              </button>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-8 md:grid-cols-2 xl:grid-cols-3">
              {TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTemplateSelect(item.id)}
                  className={`group relative overflow-hidden rounded-[2rem] border-4 bg-white text-left transition-all hover:shadow-2xl hover:shadow-primary/10 ${
                    state.meta.template === item.id
                      ? 'border-primary'
                      : 'border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="aspect-[1/1.3] overflow-hidden bg-slate-50">
                    <img
                      src={item.image}
                      alt={`${item.name} template example`}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                       <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                         Select Style
                       </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.defaultColor }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="w-full max-w-md rounded-[2.8rem] bg-white p-8 text-center shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              Secure Export
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Unlock PDF Download
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Pay ₹{PRICE_BASIC} and share the transaction reference on WhatsApp to receive your
              unlock code.
            </p>

            <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <img
                src={PAYMENT_QR}
                alt="Payment QR"
                className="mx-auto h-60 w-60 rounded-[1.5rem] bg-white object-contain p-4 shadow-sm"
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Transaction Reference
              </p>
              <p className="mt-2 break-all text-sm font-black text-primary">{state.meta.txnHash}</p>
            </div>

            <button
              onClick={() => {
                setShowPayment(false);
                setShowUnlock(true);
                const message = encodeURIComponent(
                  `Resume PDF payment complete\nPhone: ${state.meta.userPhone}\nReference: ${state.meta.txnHash}`,
                );
                window.open(`https://wa.me/${WHATSAPP_NO}?text=${message}`, '_blank');
              }}
              className="mt-6 w-full rounded-[1.6rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
            >
              I Have Paid
            </button>

            <button
              onClick={() => setShowPayment(false)}
              className="mt-3 w-full rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showUnlock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="w-full max-w-md rounded-[2.8rem] bg-white p-8 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              Unlock Export
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Enter the download code
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Paste the code you received after payment confirmation.
            </p>

            <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Reference
              </p>
              <p className="mt-2 break-all text-sm font-black text-primary">{state.meta.txnHash}</p>
            </div>

            <input
              type="password"
              maxLength={8}
              value={unlockPassword}
              onChange={(event) => setUnlockPassword(event.target.value)}
              placeholder="00000000"
              className="mt-5 w-full rounded-[1.8rem] border-2 border-transparent bg-slate-50 px-5 py-5 text-center text-3xl font-black tracking-[0.3em] text-slate-900 outline-none transition focus:border-primary focus:bg-white"
            />

            <button
              onClick={handleUnlock}
              disabled={isGeneratingDownload}
              className="mt-6 w-full rounded-[1.6rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isGeneratingDownload ? 'Preparing PDF...' : 'Unlock and Download'}
            </button>
          </div>
        </div>
      )}

      {showTailorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="w-full max-w-3xl rounded-[2.8rem] bg-white p-8 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              AI Tailoring
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Tailor this resume to a specific job description
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              AI will generate a proposal for summary, skills, experience, and projects. You will
              approve the result before it replaces your current content.
            </p>

            <textarea
              value={state.meta.jobDescription}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_META',
                  payload: { jobDescription: event.target.value },
                })
              }
              className={`${fieldClass} mt-6 min-h-64 resize-none px-5 py-4 leading-7`}
              placeholder="Paste the job description here."
            />

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowTailorModal(false)}
                className="flex-1 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleTailorResume}
                disabled={isTailoring}
                className="flex-[1.7] rounded-[1.6rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isTailoring ? 'Generating Proposal...' : 'Generate Tailored Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aiProposal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="w-full max-w-4xl rounded-[2.8rem] bg-white p-8 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              AI Suggestion
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Review the AI rewrite before applying it
            </h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Current Text
                </p>
                <textarea
                  readOnly
                  value={aiProposal.original}
                  className="mt-4 h-72 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 outline-none"
                />
              </div>
              <div className="rounded-[2rem] border border-blue-100 bg-blue-50/60 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                  AI Proposal
                </p>
                <textarea
                  readOnly
                  value={aiProposal.suggestion}
                  className="mt-4 h-72 w-full resize-none rounded-[1.5rem] border border-blue-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setAiProposal(null)}
                className="flex-1 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-slate-300"
              >
                Keep Current Text
              </button>
              <button
                onClick={applyAiProposal}
                className="flex-[1.5] rounded-[1.6rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
              >
                Replace With AI Text
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingTailoredResume && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur">
          <div className="w-full max-w-3xl rounded-[2.8rem] bg-white p-8 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              Tailored Proposal Ready
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Review and apply the tailored resume update
            </h2>
            <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm leading-7 text-slate-600">
                AI prepared updates for:
                {pendingTailoredResume.summary ? ' summary,' : ''}
                {pendingTailoredResume.skills?.length ? ' skills,' : ''}
                {pendingTailoredResume.experience?.length ? ' experience,' : ''}
                {pendingTailoredResume.projects?.length ? ' projects' : ''}
              </p>
              {pendingTailoredResume.summary ? (
                <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Proposed Summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {pendingTailoredResume.summary}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setPendingTailoredResume(null)}
                className="flex-1 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500 transition hover:border-slate-300"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: 'MERGE_PARSED_DATA',
                    payload: pendingTailoredResume as any,
                  });
                  setPendingTailoredResume(null);
                }}
                className="flex-[1.5] rounded-[1.6rem] bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.28em] text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700"
              >
                Apply Tailored Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Builder;
