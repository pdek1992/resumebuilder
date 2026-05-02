import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View, Link, Font, Svg, Path } from '@react-pdf/renderer';
import type { ResumeState } from '../store/ResumeContext';
import {
  buildDateRange,
  getResolvedAccentColor,
  getResolvedFontFamily,
  getTemplateDefinition,
  splitDescriptionLines,
} from '../utils/resumeHelpers';

// Register standard fonts - Use local .ttf for maximum stability and offline support
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/Inter-ExtraBold.ttf', fontWeight: 900 },
  ],
});

const baseStyles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    color: '#1e293b',
    fontSize: 9,
    fontFamily: 'Inter',
  },
  pageDark: {
    padding: 0,
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: 9,
    fontFamily: 'Inter',
  },
  contentArea: {
    padding: 40,
    paddingTop: 35,
    paddingBottom: 45,
  },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    transform: 'rotate(-30deg)',
    fontSize: 60,
    color: 'rgba(30, 41, 59, 0.05)',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 12,
    zIndex: 100,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleBar: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 900,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#475569',
  },
  smallText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#64748b',
  },
  linkText: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletMark: {
    width: 10,
    fontSize: 10,
    color: '#cbd5e1',
  },
  bulletMarkNeon: {
    width: 10,
    fontSize: 10,
    color: '#22d3ee',
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    color: '#334155',
  },
  bulletTextDark: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    color: '#cbd5e1',
  },
  skillPill: {
    fontSize: 7.5,
    fontWeight: 700,
    borderRadius: 4,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 7,
    marginRight: 5,
    marginBottom: 5,
  },
  techCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
    borderStyle: 'solid',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  }
});

// Enhanced sanitization to prevent PDF generation crashes
const clean = (value: string) => {
  if (!value || typeof value !== 'string') return '';
  // Super aggressive sanitization to prevent PDF generation crashes
  // Removes all emojis, non-standard symbols, and control characters
  const cleaned = value
    .replace(/[^\x20-\x7E\n\u00A0-\u017F\u2022\u25CF]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .trim();
  
  return cleaned || ' '; // Fallback to space to avoid react-pdf rendering issues with empty strings
};

const isValidImage = (src?: string) => {
  if (!src || typeof src !== 'string') return false;
  // Payload too large (>2MB) often crashes react-pdf in browser-side rendering
  if (src.startsWith('data:image/') && src.length > 2000000) return false;
  // react-pdf only reliably supports PNG and JPEG
  return (
    src.startsWith('data:image/png') || 
    src.startsWith('data:image/jpeg') || 
    src.startsWith('data:image/jpg') ||
    src.startsWith('http')
  );
};

// Helper to sanitize links
const sanitizeLink = (url?: string) => {
  if (!url) return '';
  try {
    // Basic validation to ensure it looks like a URL or protocol
    if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) return url;
    return `https://${url.replace(/^https?:\/\//, '')}`;
  } catch {
    return '';
  }
};

const IconPhone = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 4 }}>
    <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill={color} />
  </Svg>
);
const IconEmail = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 4 }}>
    <Path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill={color} />
  </Svg>
);
const IconLocation = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 4 }}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={color} />
  </Svg>
);
const IconLinkedIn = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 4 }}>
    <Path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill={color} />
  </Svg>
);
const IconPortfolio = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 4 }}>
    <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill={color} />
  </Svg>
);

const SectionHeader: React.FC<{ title: string; accentColor: string; tone?: 'light' | 'dark'; hasBar?: boolean }> = ({
  title,
  accentColor,
  tone = 'light',
  hasBar = true,
}) => (
  <View style={baseStyles.sectionTitleRow}>
    {hasBar && <View style={[baseStyles.sectionTitleBar, { backgroundColor: accentColor }]} />}
    <Text
      style={[
        baseStyles.sectionTitle,
        { color: tone === 'dark' ? '#ffffff' : '#334155' },
      ]}
    >
      {title}
    </Text>
  </View>
);

const BulletList: React.FC<{ value: string; tone?: 'light' | 'dark' | 'neon' }> = ({
  value,
  tone = 'light',
}) => {
  const lines = splitDescriptionLines(value);

  return (
    <View style={{ marginTop: 2 }}>
      {lines.map((line, index) => {
        const content = clean(line).replace(/^[•\u25CF\-\*]\s*/, '');
        return (
          <View key={`${line}-${index}`} style={baseStyles.bulletRow}>
            <Text style={[
              baseStyles.bulletMark, 
              tone === 'neon' ? baseStyles.bulletMarkNeon : {},
              tone === 'dark' ? { color: 'rgba(255,255,255,0.4)' } : {}
            ]}>•</Text>
            <Text style={[
              baseStyles.bulletText, 
              tone === 'dark' || tone === 'neon' ? baseStyles.bulletTextDark : {}
            ]}>
              {content}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const ExperienceItem: React.FC<{
  item: ResumeState['experience'][number];
  tone?: 'light' | 'dark';
  accentColor: string;
}> = ({ item, tone = 'light', accentColor }) => (
  <View style={{ marginBottom: 12 }} wrap={false}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: tone === 'dark' ? '#ffffff' : '#0f172a' }}>
          {clean(item.role)}
        </Text>
        <Text style={{ fontSize: 8.5, color: tone === 'dark' ? 'rgba(255,255,255,0.8)' : accentColor, fontWeight: 700, marginTop: 1 }}>
          {clean(item.company)}
        </Text>
      </View>
      <Text style={{ fontSize: 7.5, fontWeight: 700, color: tone === 'dark' ? 'rgba(255,255,255,0.5)' : '#94a3b8', textTransform: 'uppercase' }}>
        {buildDateRange(item.startDate, item.endDate, item.isCurrent)}
      </Text>
    </View>
    <BulletList value={item.description} tone={tone} />
  </View>
);

const EducationItem: React.FC<{
  item: ResumeState['education'][number];
  tone?: 'light' | 'dark';
}> = ({ item, tone = 'light' }) => (
  <View style={{ marginBottom: 10 }} wrap={false}>
    <Text style={{ fontSize: 9.5, fontWeight: 700, color: tone === 'dark' ? '#ffffff' : '#0f172a' }}>
      {clean(item.degree)}
    </Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 }}>
      <Text style={{ fontSize: 8, color: tone === 'dark' ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
        {clean(item.institution)}
      </Text>
      <Text style={{ fontSize: 7.5, color: '#94a3b8' }}>
        {buildDateRange(item.startDate, item.endDate)}
      </Text>
    </View>
    {item.score && (
      <Text style={{ fontSize: 7.5, fontWeight: 700, color: tone === 'dark' ? 'rgba(255,255,255,0.5)' : '#94a3b8', marginTop: 1 }}>
        Result: {clean(item.score)}
      </Text>
    )}
  </View>
);

const ProjectItem: React.FC<{
  item: ResumeState['projects'][number];
  tone?: 'light' | 'dark';
  accentColor: string;
}> = ({ item, tone = 'light', accentColor }) => (
  <View style={{ marginBottom: 10 }} wrap={false}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 9.5, fontWeight: 700, color: tone === 'dark' ? '#ffffff' : '#0f172a' }}>
        {clean(item.name)}
      </Text>
      {item.link && (
        <Link src={sanitizeLink(item.link)} style={{ fontSize: 7.5, color: tone === 'dark' ? '#38bdf8' : accentColor, textDecoration: 'none' }}>
          View Project
        </Link>
      )}
    </View>
    <BulletList value={item.description} tone={tone} />
  </View>
);

const SkillsCloud: React.FC<{
  skills: string[];
  languages: string[];
  accentColor: string;
  template?: string;
  tone?: 'light' | 'dark';
}> = ({ skills, languages, accentColor, template, tone = 'light' }) => (
  <View wrap={false}>
    {template === 'CorporateMinimal' ? (
      <View style={{ gap: 8 }}>
        {skills.filter(s => s && typeof s === 'string').slice(0, 10).map((skill, idx) => (
          <View key={skill}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#334155' }}>{clean(skill)}</Text>
              <Text style={{ fontSize: 7, color: '#94a3b8' }}>{85 + (idx % 15)}%</Text>
            </View>
            <View style={{ height: 2, backgroundColor: '#f1f5f9', borderRadius: 1 }}>
               <View style={{ height: 2, width: `${85 + (idx % 15)}%`, backgroundColor: accentColor, borderRadius: 1 }} />
            </View>
          </View>
        ))}
      </View>
    ) : template === 'CreativeDesigner' ? (
      <View style={{ gap: 6 }}>
        {skills.filter(s => s && typeof s === 'string').slice(0, 12).map((skill) => (
          <View key={skill} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.25pt solid #f1f5f9', paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#334155' }}>{clean(skill)}</Text>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: i < 4 ? accentColor : '#e2e8f0' }} />
              ))}
            </View>
          </View>
        ))}
      </View>
    ) : (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {skills.filter(s => s && typeof s === 'string').map((skill) => (
          <View
            key={skill}
            style={[
              baseStyles.skillPill,
              {
                backgroundColor: tone === 'dark' ? 'rgba(255,255,255,0.08)' : `${accentColor}08`,
                borderColor: tone === 'dark' ? 'rgba(255,255,255,0.15)' : `${accentColor}20`,
                borderWidth: 0.5,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              style={{
                color: tone === 'dark' ? '#ffffff' : '#334155',
                fontSize: 7.5,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {clean(skill)}
            </Text>
          </View>
        ))}
      </View>
    )}
    {languages.length > 0 && (
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 7, fontWeight: 900, color: tone === 'dark' ? 'rgba(255,255,255,0.5)' : '#94a3b8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>Languages</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {languages.filter(l => l && typeof l === 'string').map((lang) => (
             <View
              key={lang}
              style={[
                baseStyles.skillPill,
                {
                  backgroundColor: tone === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  borderColor: tone === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                  borderWidth: 0.5,
                },
              ]}
            >
              <Text style={{ fontSize: 7, color: tone === 'dark' ? 'rgba(255,255,255,0.9)' : '#64748b' }}>{clean(lang)}</Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </View>
);

const ResumeDocument: React.FC<{ data: ResumeState }> = ({ data }) => {
  const accentColor = getResolvedAccentColor(data);
  const fontFamily = getResolvedFontFamily(data);
  const template = getTemplateDefinition(data.meta.template);
  const { layout } = template;
  const isPaid = data.meta.isPaid;

  const renderContact = (tone: 'light' | 'dark' = 'light', align: 'left' | 'right' | 'center' = 'left') => {
    const iconColor = tone === 'dark' ? '#cbd5e1' : '#64748b';
    return (
      <View style={{ alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
        {[
          { val: data.personalInfo.email, link: `mailto:${data.personalInfo.email}`, Icon: IconEmail },
          { val: data.personalInfo.phone, link: `tel:${data.personalInfo.phone}`, Icon: IconPhone },
          { val: data.personalInfo.location, Icon: IconLocation },
          { val: data.personalInfo.linkedin, link: data.personalInfo.linkedin, Icon: IconLinkedIn },
          { val: data.personalInfo.portfolio, link: data.personalInfo.portfolio, Icon: IconPortfolio },
        ].filter(item => item.val).map((item, i) => (
          <View key={i} style={baseStyles.contactItem}>
            <item.Icon color={iconColor} />
            {item.link ? (
              <Link src={sanitizeLink(item.link)} style={[baseStyles.smallText, { color: tone === 'dark' ? '#cbd5e1' : '#64748b', textDecoration: 'none', fontSize: 7.5 }]}>
                {clean(item.val)}
              </Link>
            ) : (
              <Text style={[baseStyles.smallText, { color: tone === 'dark' ? '#cbd5e1' : '#64748b', fontSize: 7.5 }]}>
                {clean(item.val)}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const pageStyle = data.meta.template === 'DeepCharcoal' ? baseStyles.pageDark : baseStyles.page;
  const customBg = data.meta.template === 'PastelProfessional' ? `${accentColor}05` : (data.meta.template === 'DeepCharcoal' ? '#0f172a' : '#ffffff');

  return (
    <Page size="A4" style={[pageStyle, { fontFamily: fontFamily === 'Helvetica' ? 'Inter' : fontFamily, backgroundColor: customBg }]}>
      {!isPaid && <Text style={baseStyles.watermark}>Preview Locked</Text>}
      
      {/* Multi-page sidebar background fix */}
      {layout.sidebar && (
        <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 190, backgroundColor: accentColor }} fixed />
      )}

      {data.meta.template === 'Executive' && (
        <View style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'solid' }} />
      )}

      {data.meta.template === 'CorporateMinimal' && (
        <View style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 1, borderColor: `${accentColor}40`, borderStyle: 'solid' }} />
      )}

      {data.meta.template === 'Startup' && (
        <View style={{ position: 'absolute', left: 40, top: 40, height: 60, width: 2, backgroundColor: accentColor }} />
      )}
      
      {/* 1. Header Band (If layout uses a top header band) */}
      {layout.headerBand && (
        <View style={{ backgroundColor: accentColor, padding: 35, color: '#ffffff' }} wrap={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>{clean(data.personalInfo.fullName)}</Text>
              <Text style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
                {clean(data.meta.targetRole)}
              </Text>
            </View>
            {renderContact('dark', 'right')}
            {isValidImage(data.personalInfo.profileImage) && (
              <Image src={data.personalInfo.profileImage} style={{ width: 65, height: 65, borderRadius: 32.5, marginLeft: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'solid' }} />
            )}
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        {/* 2-COLUMN LEFT PANEL: Static sections (Contact, Skills, Certifications) */}
        {layout.sidebar && (
          <View style={{ width: 190, padding: 25, color: '#ffffff' }}>
            {isValidImage(data.personalInfo.profileImage) && !layout.headerBand && (
              <Image src={data.personalInfo.profileImage} style={{ width: 110, height: 110, borderRadius: 55, marginBottom: 20, alignSelf: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'solid' }} />
            )}
            {!layout.headerBand && (
              <View style={{ marginBottom: 25 }}>
                <Text style={{ fontSize: 22, fontWeight: 900 }}>{clean(data.personalInfo.fullName)}</Text>
                <Text style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 5, textTransform: 'uppercase' }}>
                  {clean(data.meta.targetRole)}
                </Text>
              </View>
            )}
            
            <View style={baseStyles.section} wrap={false}>
              <SectionHeader title="Contact" accentColor="#ffffff" tone="dark" />
              {renderContact('dark')}
            </View>

            <View style={baseStyles.section} wrap={false}>
              <SectionHeader title="Skills & Competencies" accentColor="#ffffff" tone="dark" />
              <SkillsCloud skills={data.skills} languages={data.languages} accentColor="#ffffff" template={data.meta.template} tone="dark" />
            </View>

            {data.certifications.length > 0 && (
              <View style={baseStyles.section}>
                <SectionHeader title="Certifications" accentColor="#ffffff" tone="dark" />
                {data.certifications.map(cert => (
                  <View key={cert.id} style={{ marginBottom: 8 }} wrap={false}>
                    <Text style={{ fontSize: 9, fontWeight: 700, color: '#ffffff' }}>{clean(cert.name)}</Text>
                    <Text style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{clean(cert.issuer)} • {cert.date}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* MAIN CONTENT AREA */}
        <View style={[baseStyles.contentArea, { flex: 1 }]}>
          
          {/* Header (If not already rendered in band or sidebar) */}
          {!layout.headerBand && !layout.sidebar && (
            <View style={{ 
              marginBottom: 25, 
              borderBottom: data.meta.template === 'Executive' ? 'none' : `1.5pt solid ${accentColor}`, 
              paddingBottom: 20,
              alignItems: data.meta.template === 'ModernColumns' ? 'center' : 'stretch'
            }} wrap={false}>
              <View style={{ 
                flexDirection: data.meta.template === 'ModernColumns' ? 'column' : 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                textAlign: data.meta.template === 'ModernColumns' ? 'center' : 'left'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isValidImage(data.personalInfo.profileImage) && (
                    <Image src={data.personalInfo.profileImage} style={{ width: 70, height: 70, borderRadius: 35, marginRight: 20, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'solid' }} />
                  )}
                  <View style={{ alignItems: data.meta.template === 'ModernColumns' ? 'center' : 'flex-start' }}>
                    <Text style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>{clean(data.personalInfo.fullName)}</Text>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
                      {clean(data.meta.targetRole)}
                    </Text>
                  </View>
                </View>
                {renderContact('light', 'right')}
              </View>
            </View>
          )}

          {/* Flexible Column Layout Logic */}
          <View style={{ flexDirection: layout.columns === 2 && !layout.sidebar ? 'row' : 'column', gap: layout.columns === 2 && !layout.sidebar ? 25 : 0 }}>
            
            {/* If 2-columns but no sidebar (ModernColumns style) -> enforce static left, dynamic right */}
            {layout.columns === 2 && !layout.sidebar ? (
              <>
                {/* Left Panel: Static */}
                <View style={{ flex: 1 }}>
                  <View style={baseStyles.section} wrap={false}>
                    <SectionHeader title="Skills" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    <SkillsCloud skills={data.skills} languages={data.languages} accentColor={accentColor} template={data.meta.template} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                  </View>
                  
                  {data.certifications.length > 0 && (
                    <View style={baseStyles.section}>
                      <SectionHeader title="Certifications" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                      {data.certifications.map(cert => (
                        <View key={cert.id} style={{ marginBottom: 8 }} wrap={false}>
                          <Text style={{ fontSize: 9, fontWeight: 700, color: data.meta.template === 'DeepCharcoal' ? '#ffffff' : '#334155' }}>{clean(cert.name)}</Text>
                          <Text style={{ fontSize: 7.5, color: data.meta.template === 'DeepCharcoal' ? 'rgba(255,255,255,0.6)' : '#64748b', marginTop: 1 }}>{clean(cert.issuer)} • {cert.date}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Right Panel: Dynamic */}
                <View style={{ flex: 2 }}>
                  {data.summary && (
                    <View style={baseStyles.section} wrap={false}>
                      <SectionHeader title="Professional Summary" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                      <Text style={[baseStyles.bodyText, { color: data.meta.template === 'DeepCharcoal' ? '#cbd5e1' : '#475569' }]}>{clean(data.summary)}</Text>
                    </View>
                  )}

                  <View style={baseStyles.section}>
                    <SectionHeader title="Experience" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.experience.map(exp => (
                      <ExperienceItem key={exp.id} item={exp} accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    ))}
                  </View>

                  {data.projects.length > 0 && (
                    <View style={baseStyles.section}>
                      <SectionHeader title="Projects" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                      {data.projects.map(project => (
                        <ProjectItem key={project.id} item={project} accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                      ))}
                    </View>
                  )}

                  <View style={baseStyles.section}>
                    <SectionHeader title="Education" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.education.map(edu => (
                      <EducationItem key={edu.id} item={edu} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    ))}
                  </View>
                </View>
              </>
            ) : (
              /* Single column / Right Sidebar Layout */
              <View>
                {data.summary && (
                  <View style={baseStyles.section} wrap={false}>
                    <SectionHeader title="Professional Summary" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    <Text style={[baseStyles.bodyText, { color: data.meta.template === 'DeepCharcoal' ? '#cbd5e1' : '#475569' }]}>{clean(data.summary)}</Text>
                  </View>
                )}

                {/* In 1-column layout, skills go directly below summary */}
                {!layout.sidebar && (
                  <View style={baseStyles.section} wrap={false}>
                    <SectionHeader title="Skills & Competencies" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    <SkillsCloud skills={data.skills} languages={data.languages} accentColor={accentColor} template={data.meta.template} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                  </View>
                )}

                <View style={baseStyles.section}>
                  <SectionHeader title="Experience" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                  {data.experience.map(exp => (
                    <ExperienceItem key={exp.id} item={exp} accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                  ))}
                </View>

                {data.projects.length > 0 && (
                  <View style={baseStyles.section}>
                    <SectionHeader title="Projects" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.projects.map(project => (
                      <ProjectItem key={project.id} item={project} accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    ))}
                  </View>
                )}

                {!layout.sidebar && data.certifications.length > 0 && (
                  <View style={baseStyles.section}>
                    <SectionHeader title="Certifications" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.certifications.map(cert => (
                      <View key={cert.id} style={{ marginBottom: 8 }} wrap={false}>
                        <Text style={{ fontSize: 9, fontWeight: 700, color: data.meta.template === 'DeepCharcoal' ? '#ffffff' : '#334155' }}>{clean(cert.name)}</Text>
                        <Text style={{ fontSize: 7.5, color: data.meta.template === 'DeepCharcoal' ? 'rgba(255,255,255,0.6)' : '#64748b', marginTop: 1 }}>{clean(cert.issuer)} • {cert.date}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {data.education.length > 0 && (
                  <View style={baseStyles.section}>
                    <SectionHeader title="Education" accentColor={accentColor} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    {data.education.map(edu => (
                      <EducationItem key={edu.id} item={edu} tone={data.meta.template === 'DeepCharcoal' ? 'dark' : 'light'} />
                    ))}
                  </View>
                )}
              </View>
            )}

          </View>
        </View>
      </View>
    </Page>
  );
};

const ResumePDF: React.FC<{ data: ResumeState }> = ({ data }) => {
  return (
    <Document title={`${data.personalInfo.fullName} Resume`} author="PremiumAI Resume Builder" keywords="resume, cv, ai builder">
      <ResumeDocument data={data} />
    </Document>
  );
};

export default ResumePDF;
