import paymentQr from '../../QRCode.jpeg';

export const UPI_ID = '9823340379@upi';
export const WHATSAPP_NO = '919823340379';
export const PRICE_BASIC = 100;
export const PRICE_PRO = 150;
export const PAYMENT_QR = paymentQr;

export const COLOR_SWATCHES = [
  '#1d4ed8',
  '#0f766e',
  '#7c2d12',
  '#7c3aed',
  '#be123c',
  '#334155',
] as const;

export const FONT_PRESETS = [
  { id: 'Helvetica', label: 'Modern Sans' },
  { id: 'Times-Roman', label: 'Editorial Serif' },
  { id: 'Courier', label: 'Technical Mono' },
] as const;

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  image: string;
  layout: {
    sidebar?: boolean;
    headerBand?: boolean;
    columns?: 1 | 2;
    compact?: boolean;
    accents?: boolean;
  };
  defaultColor: string;
  fontFamily?: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'MinimalATS',
    name: 'ATS Minimal',
    description: 'Clean header block with balanced two-column body for high readability.',
    image: '/templates/minimal-ats.png',
    layout: { headerBand: true, columns: 2, compact: true },
    defaultColor: '#0d6b7b',
  },
  {
    id: 'ModernProfessional',
    name: 'Modern Professional',
    description: 'Structured header band with balanced sections.',
    image: '/templates/modern-professional.png',
    layout: { headerBand: true, columns: 1 },
    defaultColor: '#0f766e',
  },
  {
    id: 'Executive',
    name: 'Executive',
    description: 'Serif-forward layout for senior and leadership roles.',
    image: '/templates/executive.png',
    layout: { columns: 1, accents: true },
    defaultColor: '#1e293b',
    fontFamily: 'Times-Roman',
  },
  {
    id: 'Hybrid',
    name: 'Hybrid',
    description: 'Timeline-style layout with compact supporting columns.',
    image: '/templates/hybrid.png',
    layout: { columns: 2, compact: true },
    defaultColor: '#1d4ed8',
  },
  {
    id: 'Creative',
    name: 'Creative',
    description: 'Color-block sidebar with expressive profile presentation.',
    image: '/templates/creative.png',
    layout: { sidebar: true, columns: 1 },
    defaultColor: '#be123c',
  },
  {
    id: 'ModernColumns',
    name: 'Modern Columns',
    description: 'Two-column layout for high information density.',
    image: '/templates/modern-columns.png',
    layout: { columns: 2 },
    defaultColor: '#0f766e',
  },
  {
    id: 'SleekDark',
    name: 'Sleek Dark',
    description: 'Dark statement header with premium contrast.',
    image: '/templates/sleek-dark.png',
    layout: { headerBand: true, accents: true },
    defaultColor: '#111827',
  },
  {
    id: 'LuxuryGold',
    name: 'Luxury Gold',
    description: 'Elegant spacing and refined gold-accent tone.',
    image: '/templates/luxury-gold.png',
    layout: { columns: 2, accents: true },
    defaultColor: '#a16207',
  },
  {
    id: 'Impactful',
    name: 'Impactful',
    description: 'Bold typography that prioritizes measurable impact.',
    image: '/templates/impactful.png',
    layout: { headerBand: true, columns: 1, compact: true },
    defaultColor: '#b91c1c',
  },
  {
    id: 'Infographic',
    name: 'Infographic',
    description: 'Visual sidebar style for polished modern profiles.',
    image: '/templates/infographic.png',
    layout: { sidebar: true, columns: 1, accents: true },
    defaultColor: '#0f766e',
  },
  {
    id: 'Startup',
    name: 'Startup',
    description: 'Clean, energetic layout for product and growth teams.',
    image: '/templates/startup.png',
    layout: { headerBand: true, columns: 1 },
    defaultColor: '#7c3aed',
  },
  {
    id: 'ClassicAcademic',
    name: 'Classic Academic',
    description: 'Research-friendly structure with conservative styling.',
    image: '/templates/classic-academic.png',
    layout: { columns: 1 },
    defaultColor: '#334155',
  },
  {
    id: 'UltraMinimalist',
    name: 'Ultra Minimalist',
    description: 'Ultra clean layout with a sidebar for skills and high white-space for readability.',
    image: '/templates/ultra-minimalist.png',
    layout: { sidebar: true, columns: 1, compact: true },
    defaultColor: '#000000',
  },
  {
    id: 'CreativeDesigner',
    name: 'Creative Designer',
    description: 'Expressive layout with vibrant accents, progress dots for skills, and project showcases.',
    image: '/templates/creative-designer.png',
    layout: { sidebar: true, columns: 1, accents: true },
    defaultColor: '#f97316',
  },
  {
    id: 'DeepCharcoal',
    name: 'Deep Charcoal',
    description: 'Premium dark-mode template with neon glowing accents and timeline flow.',
    image: '/templates/deep-charcoal.png',
    layout: { sidebar: true, columns: 1, accents: true },
    defaultColor: '#06b6d4',
  },
  {
    id: 'CorporateMinimal',
    name: 'Corporate Minimal',
    description: 'Beige-themed professional layout with slider progress bars for technical skills.',
    image: '/templates/corporate-minimal.png',
    layout: { sidebar: true, columns: 1 },
    defaultColor: '#1e293b',
  },
  {
    id: 'PastelProfessional',
    name: 'Pastel Professional',
    description: 'Soft wave header with pastel tones and tag-based skills presentation.',
    image: '/templates/pastel-professional.png',
    layout: { headerBand: true, columns: 1, accents: true },
    defaultColor: '#0ea5e9',
  },
  {
    id: 'VibrantStartup',
    name: 'Vibrant Startup',
    description: 'Modern tech-focused layout with icon cards and gradient profile presentation.',
    image: '/templates/vibrant-startup.png',
    layout: { sidebar: true, columns: 1, accents: true },
    defaultColor: '#8b5cf6',
  },
];

export type TemplateId = string;

export const TEMPLATE_MAP = Object.fromEntries(
  TEMPLATES.map((template) => [template.id, template]),
) as Record<string, TemplateDefinition>;

export const AI_ERROR_CODES: Record<number, string> = {
  100: 'Quota exceeded for AI service.',
  101: 'The AI model is currently unavailable.',
  102: 'Too many requests. Please wait a moment.',
  103: 'Authentication error with AI provider.',
  104: 'Connection issue. Please check your network.',
  105: 'AI generated an invalid response. Please try again.',
};
