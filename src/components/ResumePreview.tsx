import React from 'react';
import type { ResumeState } from '../store/ResumeContext';
import {
  buildDateRange,
  getResolvedAccentColor,
  getResolvedFontFamily,
  getTemplateDefinition,
  splitDescriptionLines,
} from '../utils/resumeHelpers';

type PreviewSection =
  | 'personal'
  | 'experience'
  | 'education'
  | 'skills'
  | 'more';

const SectionHeader: React.FC<{
  title: string;
  accentColor: string;
  tone?: 'light' | 'dark';
  hasBar?: boolean;
}> = ({ title, accentColor, tone = 'light', hasBar = true }) => (
  <div className="flex items-center gap-2 mb-4">
    {hasBar && (
      <div 
        className="w-1.5 h-6 rounded-full" 
        style={{ backgroundColor: accentColor }} 
      />
    )}
    <h3 
      className={`text-[11px] font-black uppercase tracking-[0.2em] ${tone === 'dark' ? 'text-white' : 'text-slate-800'}`}
    >
      {title}
    </h3>
  </div>
);

const BulletList: React.FC<{ value: string; tone?: 'light' | 'dark' | 'neon' }> = ({
  value,
  tone = 'light',
}) => {
  const lines = splitDescriptionLines(value);

  if (!lines.length) {
    return (
      <p className={tone === 'neon' ? 'text-cyan-400/40' : tone === 'dark' ? 'text-white/40' : 'text-slate-300 italic'}>
        No details added yet...
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const content = line.replace(/^[•\u25CF\-\*]\s*/, '');
        return (
          <div key={`${line}-${index}`} className="flex gap-2 text-[10px] leading-relaxed">
            <span className={tone === 'neon' ? 'text-cyan-400' : tone === 'dark' ? 'text-white/40' : 'text-slate-300'}>•</span>
            <span className={tone === 'neon' ? 'text-cyan-50' : tone === 'dark' ? 'text-white/90' : 'text-slate-600'}>{content}</span>
          </div>
        );
      })}
    </div>
  );
};

const SkillDots: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((_, i) => (
      <div 
        key={i} 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: i < 4 ? accentColor : `${accentColor}40` }} 
      />
    ))}
  </div>
);

const SkillSlider: React.FC<{ accentColor: string; value: number }> = ({ accentColor, value }) => (
  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
    <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: accentColor }} />
  </div>
);

const ResumePreview: React.FC<{
  data: ResumeState;
  activeSection?: PreviewSection;
}> = ({ data }) => {
  const template = getTemplateDefinition(data.meta.template);
  const { layout } = template;
  const accentColor = getResolvedAccentColor(data);
  const fontFamily = getResolvedFontFamily(data);

  const cssFontFamily =
    fontFamily === 'Times-Roman'
      ? 'Georgia, "Times New Roman", serif'
      : fontFamily === 'Courier'
        ? '"IBM Plex Mono", "Courier New", monospace'
        : '"Inter", system-ui, sans-serif';

  const renderContact = (tone: 'light' | 'dark' = 'light', align: 'left' | 'right' | 'center' = 'left') => {
    const items = [
      { val: data.personalInfo.email, link: `mailto:${data.personalInfo.email}` },
      { val: data.personalInfo.phone, link: `tel:${data.personalInfo.phone}` },
      { val: data.personalInfo.location },
      { val: data.personalInfo.linkedin, link: data.personalInfo.linkedin },
      { val: data.personalInfo.portfolio, link: data.personalInfo.portfolio },
    ].filter(item => item.val);

    return (
      <div className={`flex flex-col gap-1.5 ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
        {items.map((item, i) => (
          item.link ? (
            <a 
              key={i} 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[12px] transition-colors underline decoration-transparent hover:decoration-current ${tone === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {item.val}
            </a>
          ) : (
            <span 
              key={i} 
              className={`text-[12px] ${tone === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {item.val}
            </span>
          )
        ))}
      </div>
    );
  };

  const skillPillClass = `
    inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold tracking-wide
    border transition-all duration-200 hover:scale-105
  `;

  return (
    <div 
      className="bg-white shadow-2xl mx-auto w-full max-w-[800px] min-h-[1131px] text-slate-800 overflow-hidden relative group/resume"
      style={{ fontFamily: cssFontFamily }}
    >
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent pointer-events-none" />
      
      {data.meta.template === 'Executive' && (
        <div className="absolute inset-5 border border-slate-200 pointer-events-none" />
      )}

      {data.meta.template === 'Startup' && (
        <div className="absolute left-8 top-10 w-1 h-16 pointer-events-none" style={{ backgroundColor: accentColor }} />
      )}

      {data.meta.template === 'PastelProfessional' && (
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-sky-100/50 to-transparent pointer-events-none" style={{ borderRadius: '0 0 50% 50% / 0 0 20px 20px' }} />
      )}

      {data.meta.template === 'DeepCharcoal' && (
        <div className="absolute inset-0 bg-[#0f172a] pointer-events-none" />
      )}
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_top_right,var(--accent),transparent)]" style={{ '--accent': accentColor } as any} />

      {/* Header Band */}
      {layout.headerBand && (
        <div 
          className="p-10 flex items-center justify-between gap-8 transition-colors duration-500"
          style={{ backgroundColor: accentColor, color: '#ffffff' }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-8">
              {data.personalInfo.profileImage && (
                <img 
                  src={data.personalInfo.profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-xl"
                />
              )}
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none mb-2">{data.personalInfo.fullName}</h1>
                <p className="text-lg font-bold text-white/80 uppercase tracking-[0.2em]">{data.meta.targetRole}</p>
              </div>
            </div>
            {renderContact('dark', 'right')}
          </div>
          {/* Subtle pattern for header band */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
      )}

      <div className="flex min-h-[900px]">
        {/* Sidebar */}
        {layout.sidebar && (
          <div 
            className={`w-[280px] p-8 text-white shrink-0 relative ${data.meta.template === 'CorporateMinimal' ? 'bg-[#f8f5f0]' : ''}`}
            style={{ backgroundColor: data.meta.template === 'CorporateMinimal' ? '#f8f5f0' : accentColor }}
          >
            {data.personalInfo.profileImage && !layout.headerBand && (
              <div className="relative mx-auto mb-8 w-40 h-40">
                {data.meta.template === 'VibrantStartup' && (
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 animate-spin-slow blur-sm" />
                )}
                <img 
                  src={data.personalInfo.profileImage} 
                  alt="Profile" 
                  className={`w-full h-full rounded-full object-cover relative z-10 border-4 shadow-2xl hover:scale-105 transition-transform ${data.meta.template === 'DeepCharcoal' ? 'border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-white/20'}`}
                />
              </div>
            )}
            
            {!layout.headerBand && (
              <div className="mb-10 text-center">
                <h1 className={`text-2xl font-black mb-2 ${data.meta.template === 'CorporateMinimal' ? 'text-slate-900' : 'text-white'}`}>{data.personalInfo.fullName}</h1>
                <p className={`text-xs font-bold uppercase tracking-widest ${data.meta.template === 'CorporateMinimal' ? 'text-slate-500' : 'text-white/70'}`}>{data.meta.targetRole}</p>
              </div>
            )}

            <div className="space-y-10">
              <section>
                <SectionHeader title="Contact" accentColor="#fff" tone="dark" />
                {renderContact('dark')}
              </section>

              <section>
                <SectionHeader title="Skills" accentColor={data.meta.template === 'CorporateMinimal' ? '#1e293b' : '#fff'} tone={data.meta.template === 'CorporateMinimal' ? 'light' : 'dark'} />
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, idx) => (
                    data.meta.template === 'CreativeDesigner' ? (
                      <div key={skill} className="w-full flex items-center justify-between py-1 border-b border-white/10">
                        <span className="text-[11px] font-bold">{skill}</span>
                        <SkillDots accentColor={accentColor} />
                      </div>
                    ) : data.meta.template === 'CorporateMinimal' ? (
                      <div key={skill} className="w-full mb-3">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span>{skill}</span>
                          <span>{85 + (idx % 15)}%</span>
                        </div>
                        <SkillSlider accentColor={accentColor} value={85 + (idx % 15)} />
                      </div>
                    ) : (
                      <span 
                        key={skill}
                        className={skillPillClass}
                        style={{ 
                          backgroundColor: data.meta.template === 'CorporateMinimal' ? 'rgba(30,41,59,0.05)' : `${accentColor}10`,
                          borderColor: data.meta.template === 'CorporateMinimal' ? 'rgba(30,41,59,0.1)' : `${accentColor}20`,
                          color: data.meta.template === 'CorporateMinimal' ? '#1e293b' : '#334155',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        {skill}
                      </span>
                    )
                  ))}
                </div>
                {data.languages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.languages.map(lang => (
                        <span key={lang} className="text-xs text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionHeader title="Education" accentColor="#fff" tone="dark" />
                <div className="space-y-6">
                  {data.education.map(edu => (
                    <div key={edu.id} className="group/edu">
                      <h3 className="text-[13px] font-bold leading-snug group-hover/edu:text-white transition-colors">{edu.degree}</h3>
                      <p className="text-[11px] text-white/70 mt-1">{edu.institution}</p>
                      <p className="text-[10px] text-white/50 font-bold uppercase mt-1">
                        {buildDateRange(edu.startDate, edu.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-10">
          {!layout.headerBand && !layout.sidebar && (
            <div className={`mb-10 pb-8 transition-all duration-300 ${data.meta.template === 'Executive' ? '' : 'border-b-2'}`} style={{ borderColor: `${accentColor}40` }}>
              <div className={`flex items-center justify-between gap-8 ${data.meta.template === 'ModernColumns' ? 'flex-col text-center' : ''}`}>
                <div className={`flex items-center gap-6 ${data.meta.template === 'ModernColumns' ? 'flex-col' : ''}`}>
                  {data.personalInfo.profileImage && (
                    <div className={`shrink-0 overflow-hidden rounded-2xl border-4 shadow-xl ${data.meta.template === 'ModernColumns' ? 'w-32 h-32 rounded-full' : 'w-24 h-24'}`} style={{ borderColor: `${accentColor}20` }}>
                      <img src={data.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h1 className={`text-4xl font-black tracking-tight mb-2 leading-none ${data.meta.template === 'DeepCharcoal' ? 'text-white' : 'text-slate-900'}`}>{data.personalInfo.fullName}</h1>
                    <p className={`text-[12px] font-black uppercase tracking-[0.3em] ${data.meta.template === 'ModernColumns' ? 'text-center' : ''}`} style={{ color: accentColor }}>{data.meta.targetRole}</p>
                  </div>
                </div>
                {renderContact(data.meta.template === 'DeepCharcoal' ? 'dark' : 'light', data.meta.template === 'ModernColumns' ? 'center' : 'right')}
              </div>
            </div>
          )}

          <div className="space-y-12">
            {data.summary && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SectionHeader title="About Me" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                <p className={`text-[14px] leading-relaxed font-medium ${data.meta.template === 'DeepCharcoal' ? 'text-slate-300' : 'text-slate-600'}`}>{data.summary}</p>
              </section>
            )}

            <div className="flex gap-10">
              {/* Left Side */}
              <div className={layout.columns === 2 ? 'flex-[1.6]' : 'flex-1'}>
                <section>
                  <SectionHeader title="Experience" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                  <div className="space-y-10">
                    {data.experience.map(exp => (
                      <div key={exp.id} className="relative pl-0 group/exp">
                        {data.meta.template === 'DeepCharcoal' && (
                          <div className="absolute left-[-2.5rem] top-0 bottom-[-2.5rem] w-0.5 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className={`text-lg font-black group-hover/exp:text-slate-700 transition-colors ${data.meta.template === 'DeepCharcoal' ? 'text-cyan-50' : 'text-slate-900'}`}>{exp.role}</h3>
                            <p className="text-sm font-bold tracking-tight" style={{ color: accentColor }}>{exp.company}</p>
                          </div>
                          <span className={`text-[11px] font-black uppercase px-2 py-1 rounded ${data.meta.template === 'DeepCharcoal' ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-400 bg-slate-50'}`}>
                            {buildDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                          </span>
                        </div>
                        <BulletList value={exp.description} tone={data.meta.template === 'DeepCharcoal' ? 'neon' : 'light'} />
                      </div>
                    ))}
                  </div>
                </section>

                {layout.columns === 1 && !layout.sidebar && (
                  <div className="mt-12 grid grid-cols-2 gap-10">
                    <section>
                      <SectionHeader title="Education" accentColor={accentColor} />
                      <div className="space-y-6">
                        {data.education.map(edu => (
                          <div key={edu.id} className="group/edu">
                            <h3 className="text-sm font-black text-slate-900">{edu.degree}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{edu.institution}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              {buildDateRange(edu.startDate, edu.endDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <SectionHeader title="Skills" accentColor={accentColor} />
                      <div className="flex flex-wrap gap-2">
                        {data.skills.map(skill => (
                          <span 
                            key={skill} 
                            className={skillPillClass}
                            style={{ 
                              backgroundColor: `${accentColor}08`,
                              borderColor: `${accentColor}20`,
                              color: accentColor 
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              {/* Right Side / Sidebar Alternative */}
              {(layout.columns === 2 || layout.sidebar) && (
                <div className="flex-1 space-y-12">
                  {!layout.sidebar && (
                    <>
                      <section>
                        <SectionHeader title="Skills" accentColor={accentColor} />
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map(skill => (
                            <span 
                              key={skill} 
                              className={skillPillClass}
                              style={{ 
                                backgroundColor: `${accentColor}08`,
                                borderColor: `${accentColor}20`,
                                color: accentColor 
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                      <section>
                        <SectionHeader title="Education" accentColor={accentColor} />
                        <div className="space-y-6">
                          {data.education.map(edu => (
                            <div key={edu.id} className="group/edu">
                              <h3 className="text-sm font-black text-slate-900">{edu.degree}</h3>
                              <p className="text-xs text-slate-500 mt-1 font-medium">{edu.institution}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                {buildDateRange(edu.startDate, edu.endDate)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                  
                  <section>
                    <SectionHeader title={data.meta.template === 'VibrantStartup' ? "Technologies" : "Projects"} accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.meta.template === 'VibrantStartup' ? (
                      <div className="grid grid-cols-3 gap-4">
                        {data.skills.slice(0, 9).map(skill => (
                          <div key={skill} className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                              {skill.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 truncate w-full">{skill}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {data.projects.map(p => (
                          <div key={p.id} className="group/proj">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`text-sm font-black group-hover/proj:text-slate-700 ${data.meta.template === 'DeepCharcoal' ? 'text-cyan-50' : 'text-slate-900'}`}>{p.name}</h3>
                              {p.link && (
                                <a 
                                  href={p.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold underline decoration-transparent hover:decoration-current"
                                  style={{ color: accentColor }}
                                >
                                  View Project
                                </a>
                              )}
                            </div>
                            <BulletList value={p.description} tone={data.meta.template === 'DeepCharcoal' ? 'neon' : 'light'} />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!data.meta.isPaid && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden">
          <div className="rotate-[-32deg] opacity-[0.05]">
            <p className="text-[120px] font-black uppercase tracking-[0.2em] text-slate-900">PREVIEW</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
