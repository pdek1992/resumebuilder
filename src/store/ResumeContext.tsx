import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { TemplateId } from '../utils/constants';
import {
  mergeResumeState,
  RESUME_STORAGE_KEY,
  RESUME_STORAGE_UPDATED_AT_KEY,
} from '../utils/resumeHelpers';

export type ResumeState = {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
    profileImage?: string;
  };
  summary: string;
  skills: string[];
  languages: string[];
  experience: {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    score: string;
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    link: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
  }[];
  meta: {
    targetRole: string;
    targetCompany: string;
    experienceLevel: string;
    industry: string;
    customIndustry: string;
    template: TemplateId;
    isPaid: boolean;
    jobDescription: string;
    userPhone: string;
    color: string;
    font: string;
    txnHash: string;
  };
  analysis: {
    score: number;
    missingSections: string[];
    suggestions: string[];
  };
};

export const initialState: ResumeState = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    profileImage: '',
  },
  summary: '',
  skills: [],
  languages: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  meta: {
    targetRole: '',
    targetCompany: '',
    experienceLevel: '',
    industry: '',
    customIndustry: '',
    template: 'MinimalATS',
    isPaid: false,
    jobDescription: '',
    userPhone: '',
    color: '#1d4ed8',
    font: 'Helvetica',
    txnHash: '',
  },
  analysis: {
    score: 0,
    missingSections: [],
    suggestions: [],
  },
};

type Action =
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<ResumeState['personalInfo']> }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  | { type: 'UPDATE_META'; payload: Partial<ResumeState['meta']> }
  | { type: 'ADD_EXPERIENCE'; payload: ResumeState['experience'][0] }
  | { type: 'UPDATE_EXPERIENCE'; payload: { id: string; data: Partial<ResumeState['experience'][0]> } }
  | { type: 'DELETE_EXPERIENCE'; payload: string }
  | { type: 'ADD_EDUCATION'; payload: ResumeState['education'][0] }
  | { type: 'UPDATE_EDUCATION'; payload: { id: string; data: Partial<ResumeState['education'][0]> } }
  | { type: 'DELETE_EDUCATION'; payload: string }
  | { type: 'ADD_PROJECT'; payload: ResumeState['projects'][0] }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; data: Partial<ResumeState['projects'][0]> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_CERTIFICATION'; payload: ResumeState['certifications'][0] }
  | { type: 'UPDATE_CERTIFICATION'; payload: { id: string; data: Partial<ResumeState['certifications'][0]> } }
  | { type: 'DELETE_CERTIFICATION'; payload: string }
  | { type: 'SET_SKILLS'; payload: string[] }
  | { type: 'SET_LANGUAGES'; payload: string[] }
  | { type: 'LOAD_STATE'; payload: Partial<ResumeState> }
  | { type: 'SET_PAID'; payload: boolean }
  | { type: 'MERGE_PARSED_DATA'; payload: Partial<ResumeState> }
  | { type: 'UPDATE_ANALYSIS'; payload: Partial<ResumeState['analysis']> }
  | { type: 'RESET_STATE' };

const reducer = (state: ResumeState, action: Action): ResumeState => {
  switch (action.type) {
    case 'UPDATE_PERSONAL_INFO':
      return { ...state, personalInfo: { ...state.personalInfo, ...action.payload } };
    case 'UPDATE_SUMMARY':
      return { ...state, summary: action.payload };
    case 'UPDATE_META':
      return { ...state, meta: { ...state.meta, ...action.payload } };
    case 'ADD_EXPERIENCE':
      return { ...state, experience: [...state.experience, action.payload] };
    case 'UPDATE_EXPERIENCE':
      return {
        ...state,
        experience: state.experience.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.data } : item,
        ),
      };
    case 'DELETE_EXPERIENCE':
      return { ...state, experience: state.experience.filter((item) => item.id !== action.payload) };
    case 'ADD_EDUCATION':
      return { ...state, education: [...state.education, action.payload] };
    case 'UPDATE_EDUCATION':
      return {
        ...state,
        education: state.education.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.data } : item,
        ),
      };
    case 'DELETE_EDUCATION':
      return { ...state, education: state.education.filter((item) => item.id !== action.payload) };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.data } : item,
        ),
      };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter((item) => item.id !== action.payload) };
    case 'ADD_CERTIFICATION':
      return { ...state, certifications: [...state.certifications, action.payload] };
    case 'UPDATE_CERTIFICATION':
      return {
        ...state,
        certifications: state.certifications.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.data } : item,
        ),
      };
    case 'DELETE_CERTIFICATION':
      return {
        ...state,
        certifications: state.certifications.filter((item) => item.id !== action.payload),
      };
    case 'SET_SKILLS':
      return { ...state, skills: action.payload };
    case 'SET_LANGUAGES':
      return { ...state, languages: action.payload };
    case 'LOAD_STATE':
      return mergeResumeState(initialState, action.payload);
    case 'SET_PAID':
      return { ...state, meta: { ...state.meta, isPaid: action.payload } };
    case 'MERGE_PARSED_DATA':
      return mergeResumeState(state, action.payload);
    case 'UPDATE_ANALYSIS':
      return { ...state, analysis: { ...state.analysis, ...action.payload } };
    case 'RESET_STATE':
      localStorage.removeItem(RESUME_STORAGE_KEY);
      localStorage.removeItem(RESUME_STORAGE_UPDATED_AT_KEY);
      return initialState;
    default:
      return state;
  }
};

const ResumeContext = createContext<{
  state: ResumeState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
    } catch (error) {
      console.error('Failed to load saved resume state.', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const stateToPersist = {
        ...state,
        meta: {
          ...state.meta,
          isPaid: false,
        },
      };

      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(stateToPersist));
      localStorage.setItem(RESUME_STORAGE_UPDATED_AT_KEY, new Date().toISOString());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    let score = 0;
    const missingSections: string[] = [];
    const suggestions: string[] = [];

    if (state.personalInfo.fullName && state.personalInfo.email && state.personalInfo.phone) {
      score += 20;
    } else {
      missingSections.push('Contact Information');
    }

    if (state.summary && state.summary.length > 50) {
      score += 15;
    } else {
      missingSections.push('Professional Summary');
    }

    if (state.experience.length > 0) {
      score += 30;
      const hasWeakBullets = state.experience.some((item) =>
        item.description
          .split('\n')
          .some((bullet) => bullet.length > 0 && bullet.length < 25),
      );
      if (hasWeakBullets) {
        suggestions.push('Strengthen short experience bullets with metrics or outcomes.');
      }
    } else {
      missingSections.push('Experience');
    }

    if (state.education.length > 0) {
      score += 15;
    } else {
      missingSections.push('Education');
    }

    if (state.skills.length >= 4) {
      score += 20;
    } else {
      missingSections.push('Skills');
    }

    if (state.meta.jobDescription && state.skills.length > 0) {
      const jobDescription = state.meta.jobDescription.toLowerCase();
      const matchedSkills = state.skills.filter((skill) =>
        jobDescription.includes(skill.toLowerCase()),
      ).length;

      if (matchedSkills < Math.ceil(state.skills.length / 2)) {
        suggestions.push('Add more JD-matching keywords to improve ATS relevance.');
      }
    }

    dispatch({
      type: 'UPDATE_ANALYSIS',
      payload: { score, missingSections, suggestions },
    });
  }, [
    state.personalInfo,
    state.summary,
    state.experience,
    state.education,
    state.skills,
    state.meta.jobDescription,
  ]);

  return <ResumeContext.Provider value={{ state, dispatch }}>{children}</ResumeContext.Provider>;
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within ResumeProvider');
  }
  return context;
};
