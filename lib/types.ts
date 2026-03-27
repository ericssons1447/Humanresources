export type ParsedCandidate = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string[];
  certifications: string[];
  workHistory: string[];
  skills: string[];
  yearsRelevantExperience: number;
  roleAlignedKeywords: string[];
  notableAchievements: string[];
  gapsOrUnclearItems: string[];
};

export type ParsedJob = {
  jobTitle: string;
  requiredQualifications: string[];
  preferredQualifications: string[];
  skills: string[];
  experienceRequirements: string;
  educationRequirements: string;
  certifications: string[];
  responsibilities: string[];
  softSkills: string[];
};

export type CandidateScore = {
  minimumQualificationsScore: number;
  preferredQualificationsScore: number;
  experienceRelevanceScore: number;
  skillsRelevanceScore: number;
  educationCertRelevanceScore: number;
  communicationDocumentQualityScore: number;
  overallFitScore: number;
  strengthsSummary: string;
  concernsSummary: string;
  explanations: Record<string, string>;
};
