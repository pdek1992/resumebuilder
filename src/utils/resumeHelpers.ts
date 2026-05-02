import type { ResumeState } from '../store/ResumeContext';
import { TEMPLATE_MAP, type TemplateId } from './constants';

export const RESUME_STORAGE_KEY = 'resumeState';
export const RESUME_STORAGE_UPDATED_AT_KEY = 'resumeStateUpdatedAt';
export const PREFERRED_GEMINI_MODEL_KEY = 'resumeBuilder.preferredGeminiModel';

const cleanString = (value: unknown) =>
  String(value ?? '')
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();

export const createId = (prefix = 'item') =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const normalizeList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n]/)
      .map((item) => cleanString(item))
      .filter(Boolean);
  }

  return [];
};

export const splitDescriptionLines = (value: string) =>
  cleanString(value)
    .split('\n')
    .map((line) => cleanString(line))
    .filter(Boolean);

const normalizeExperience = (items: unknown): ResumeState['experience'] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanString(source.id) || createId(`exp${index + 1}`),
      company: cleanString(source.company),
      role: cleanString(source.role),
      startDate: cleanString(source.startDate),
      endDate: cleanString(source.endDate),
      isCurrent: Boolean(source.isCurrent),
      description: splitDescriptionLines(cleanString(source.description)).join('\n'),
    };
  });
};

const normalizeEducation = (items: unknown): ResumeState['education'] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanString(source.id) || createId(`edu${index + 1}`),
      institution: cleanString(source.institution),
      degree: cleanString(source.degree),
      startDate: cleanString(source.startDate),
      endDate: cleanString(source.endDate),
      score: cleanString(source.score),
    };
  });
};

const normalizeProjects = (items: unknown): ResumeState['projects'] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanString(source.id) || createId(`project${index + 1}`),
      name: cleanString(source.name),
      description: splitDescriptionLines(cleanString(source.description)).join('\n'),
      link: cleanString(source.link),
    };
  });
};

const normalizeCertifications = (items: unknown): ResumeState['certifications'] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanString(source.id) || createId(`cert${index + 1}`),
      name: cleanString(source.name),
      issuer: cleanString(source.issuer),
      date: cleanString(source.date),
    };
  });
};

export const normalizeImportedResume = (
  partial: Partial<ResumeState>,
): Partial<ResumeState> => {
  const personalInfo = partial.personalInfo
    ? {
        fullName: cleanString(partial.personalInfo.fullName),
        email: cleanString(partial.personalInfo.email),
        phone: cleanString(partial.personalInfo.phone),
        location: cleanString(partial.personalInfo.location),
        linkedin: cleanString(partial.personalInfo.linkedin),
        portfolio: cleanString(partial.personalInfo.portfolio),
        profileImage: cleanString(partial.personalInfo.profileImage),
      }
    : undefined;

  return {
    personalInfo,
    summary: typeof partial.summary === 'string' ? cleanString(partial.summary) : undefined,
    skills: partial.skills ? normalizeList(partial.skills) : undefined,
    languages: partial.languages ? normalizeList(partial.languages) : undefined,
    experience: partial.experience ? normalizeExperience(partial.experience) : undefined,
    education: partial.education ? normalizeEducation(partial.education) : undefined,
    projects: partial.projects ? normalizeProjects(partial.projects) : undefined,
    certifications: partial.certifications
      ? normalizeCertifications(partial.certifications)
      : undefined,
    meta: partial.meta
      ? {
          ...partial.meta,
          targetRole: cleanString(partial.meta.targetRole),
          targetCompany: cleanString(partial.meta.targetCompany),
          experienceLevel: cleanString(partial.meta.experienceLevel),
          industry: cleanString(partial.meta.industry),
          customIndustry: cleanString(partial.meta.customIndustry),
          template: partial.meta.template,
          jobDescription: cleanString(partial.meta.jobDescription),
          userPhone: cleanString(partial.meta.userPhone),
          color: cleanString(partial.meta.color),
          font: cleanString(partial.meta.font),
        }
      : undefined,
    analysis: partial.analysis
      ? {
          score: Number(partial.analysis.score || 0),
          missingSections: normalizeList(partial.analysis.missingSections),
          suggestions: normalizeList(partial.analysis.suggestions),
        }
      : undefined,
  };
};

export const mergeResumeState = (
  base: ResumeState,
  partial: Partial<ResumeState>,
): ResumeState => {
  const normalized = normalizeImportedResume(partial);

  return {
    ...base,
    ...normalized,
    personalInfo: {
      ...base.personalInfo,
      ...normalized.personalInfo,
    },
    meta: {
      ...base.meta,
      ...normalized.meta,
      isPaid: false,
    },
    analysis: {
      ...base.analysis,
      ...normalized.analysis,
    },
    skills: normalized.skills ?? base.skills,
    languages: normalized.languages ?? base.languages,
    experience: normalized.experience ?? base.experience,
    education: normalized.education ?? base.education,
    projects: normalized.projects ?? base.projects,
    certifications: normalized.certifications ?? base.certifications,
  };
};

export const hasMeaningfulResumeData = (state: ResumeState) =>
  Boolean(
    cleanString(state.personalInfo.fullName) ||
      cleanString(state.summary) ||
      state.experience.length ||
      state.education.length ||
      state.skills.length ||
      state.projects.length,
  );

export const buildResumeFileName = (state: ResumeState) => {
  const name = cleanString(state.personalInfo.fullName) || 'resume';
  // Strict alphanumeric filename to prevent OS/Browser download issues
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `${safeName}_Resume.pdf`;
};

export const buildDateRange = (
  startDate: string,
  endDate: string,
  isCurrent?: boolean,
) => {
  const start = cleanString(startDate);
  const end = isCurrent ? 'Present' : cleanString(endDate);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end;
};

export const getInitials = (fullName: string) =>
  cleanString(fullName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'RB';

export const getTemplateDefinition = (templateId: TemplateId) =>
  TEMPLATE_MAP[templateId] ?? TEMPLATE_MAP.MinimalATS;

export const getResolvedAccentColor = (state: ResumeState) =>
  cleanString(state.meta.color) || getTemplateDefinition(state.meta.template).defaultColor;

export const getResolvedFontFamily = (state: ResumeState) =>
  cleanString(state.meta.font) || 'Helvetica';

export const createPaidResumeState = (state: ResumeState): ResumeState => ({
  ...state,
  meta: {
    ...state.meta,
    isPaid: true,
  },
});

export const readDraftUpdatedAt = () =>
  localStorage.getItem(RESUME_STORAGE_UPDATED_AT_KEY);
