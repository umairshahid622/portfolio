import type { SkillIcon, User } from "../types/user.type";
import { FrontEndIcons } from "../assets/skills/Front-End";
import { BackendEndIcons } from "../assets/skills/Back-End";
import { DatabaseIcons } from "../assets/skills/Data-Bases";
import { ToolsAndPlatformsIcons } from "../assets/skills/Tools & Platforms";
// import { OthersIcons } from "../assets/skills/Others";

const frontEndIcons: SkillIcon[] = FrontEndIcons;
const backendEndIcons: SkillIcon[] = BackendEndIcons;
const databaseIcons: SkillIcon[] = DatabaseIcons;
const toolsAndPlatformIcons: SkillIcon[] = ToolsAndPlatformsIcons;
// const othersIcons: SkillIcon[] = OthersIcons;

export const user: User = {
  firstName: "umair",
  lastName: "shahid",
  profession: "Full Stack Developer",
  titleDescription: "Developing Modern Full-Stack Applications",
  professionDescription:
    "Full-stack developer with expertise in developing web applications using React/Next.js, Angular, and mobile applications using Flutter. I have also worked with backend technologies like Node.js, Express.js, and Nest.js to create RESTful APIs.",
  workExperience: [
    {
      title: "Front-End Developer",
      companyName: "Axian Group",
      startDate: "October 2025",
      endDate: "March 2026",
      experiencePoints: [
        "Developed and maintained a cross-platform Fintech mobile application using Flutter.",
        "Integrated RESTful APIs for financial transactions, user authentication, and real-time data.",
        "Implemented state management, form validations, and secure data handling aligned with Fintech standards.",
      ],
    },
  ],
  technicalSkills: [
    {
      title: "All",
      icons: [
        ...frontEndIcons,
        ...backendEndIcons,
        ...databaseIcons,
        ...toolsAndPlatformIcons,
        // ...othersIcons,
      ],
    },
    {
      title: "Front-End",
      icons: frontEndIcons,
    },
    {
      title: "Back-End",
      icons: backendEndIcons,
    },
    {
      title: "Databases",
      icons: databaseIcons,
    },
    {
      title: "Tools & Plateforms",
      icons: toolsAndPlatformIcons,
    },
    // {
    //   title: "Others",
    //   icons: othersIcons,
    // },
  ],
};
