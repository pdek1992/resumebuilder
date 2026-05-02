import type { ResumeState } from '../store/ResumeContext';

export const DUMMY_DATA: ResumeState = {
  personalInfo: {
    fullName: 'Arjun Sharma',
    email: 'arjun.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    linkedin: 'linkedin.com/in/arjunsharma',
    portfolio: 'arjunsharma.dev',
    profileImage: '',
  },
  summary: 'Innovative Full Stack Developer with 5+ years of experience in building scalable web applications. Expert in React, Node.js, and Cloud Architecture. Proven track record of leading teams and delivering high-impact features for fintech and e-commerce platforms.',
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'GraphQL', 'Tailwind CSS', 'System Design'],
  languages: ['English (Fluent)', 'Hindi (Native)', 'Kannada (Professional)'],
  experience: [
    {
      id: '1',
      company: 'TechFlow Solutions',
      role: 'Senior Software Engineer',
      startDate: '2021-06',
      endDate: 'Present',
      isCurrent: true,
      description: 'Lead developer for the core payment processing engine, handling over 1M transactions daily.\nArchitected a microservices-based notification system using AWS Lambda and SQS.\nMentored a team of 4 junior developers and improved code coverage from 60% to 92%.',
    },
    {
      id: '2',
      company: 'Digital Wave Agency',
      role: 'Full Stack Developer',
      startDate: '2019-01',
      endDate: '2021-05',
      isCurrent: false,
      description: 'Developed and maintained 15+ client websites using React and Express.\nReduced page load times by 40% through advanced image optimization and code splitting.\nImplemented secure OAuth2 authentication flows for multiple client portals.',
    }
  ],
  education: [
    {
      id: 'e1',
      institution: 'Indian Institute of Technology, Madras',
      degree: 'B.Tech in Computer Science',
      startDate: '2014',
      endDate: '2018',
      score: '8.9 CGPA',
    }
  ],
  projects: [
    {
      id: 'p1',
      name: 'E-com Engine',
      description: 'High-performance e-commerce backend built with NestJS and PostgreSQL.',
      link: 'github.com/arjun/ecom-engine'
    }
  ],
  certifications: [
    {
      id: 'c1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2022'
    }
  ],
  meta: {
    targetRole: 'Senior Frontend Engineer',
    targetCompany: 'Google',
    experienceLevel: 'Senior',
    industry: 'Technology',
    customIndustry: '',
    template: 'Executive',
    isPaid: false,
    jobDescription: '',
    userPhone: '9823340379',
    color: '#1d4ed8',
    font: 'Helvetica',
    txnHash: '',
  },
  analysis: {
    score: 85,
    missingSections: [],
    suggestions: ['Add more metrics to your recent experience bullets.', 'Include your GitHub link in the personal info.']
  }
};
