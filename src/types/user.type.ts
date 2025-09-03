export interface User {
  firstName: string;
  lastName: string;
  profession: string;
  titleDescription: string;
  professionDescription: string;
  technicalSkills: TechnicalSkills[];
}

export interface TechnicalSkills {
  title: SkillsCategory;
  icons: SkillIcon[];
}

export interface SkillIcon {
  title: string;
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
