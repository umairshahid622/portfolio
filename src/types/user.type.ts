export interface User {
  firstName: string;
  lastName: string;
  profession: string;
  titleDescription: string;
  professionDescription: string;
  technicalSkills: TechnicalSkills[];
  workExperience: WorkExperience[];
}


export interface WorkExperience {
  num: string;
  title: string;
  companyName: string;
  startDate: string;
  endDate: string;
  experiencePoints: string[];
}

export interface TechnicalSkills {
  title: SkillsCategory;
  icons: SkillIcon[];
}

export interface SkillIcon {
  title: string;
  url: string;
  iconPath: string;
  darkIconPath: string;
}

type SkillsCategory =
  | "All"
  | "Front-End"
  | "Back-End"
  | "Databases"
  | "Tools & Plateforms"
  | "Others";

