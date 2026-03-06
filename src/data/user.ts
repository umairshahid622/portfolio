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
  email:"shahidumair622@gmail.com",
  phone:"92 321 5215701",
  githubLink: "https://github.com/umairshahid622",
  linkedInLink: "https://www.linkedin.com/in/umair-shahid-b72086243/",
  profession: "Full Stack Developer",
  titleDescription: "Developing Modern Full-Stack Applications",
  professionDescription:
    "Full-stack developer with expertise in developing web applications using React/Next.js, Angular, and mobile applications using Flutter. I have also worked with backend technologies like Node.js, Express.js, and Nest.js to create RESTful APIs.",

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
  workExperience: [
    {
      num: "01",
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
    {
      num: "02",
      title: "Front-End Developer",
      companyName: "BX TECHNOLOGIES",
      startDate: "April 2024",
      endDate: "October 2024",
      experiencePoints: [
        "Developed a dynamic, high-performance web application using React JS with Framer Motion to deliver fluid animations and smooth page transitions.",
        "Optimized performance through lazy loading, code-splitting, and animation efficiency techniques.",
        "Focused on accessibility, user experience, and modern design principles to enhance engagement and interactivity.",
      ],
    },
    {
      num: "03",
      title: "Front-End Developer",
      companyName: "TECKLOGICS",
      startDate: "January 2024",
      endDate: "March 2024",
      experiencePoints: [
        "Built a user-friendly web application with the Angular framework.",
        "Responsive Ul components to work seamlessly across devices, using Tailwind CSS Grid and Flexbox layouts to improve overall user engagement.",
        " Integrated RESTful API endpoints to enable real-time data synchronization, ensuring up-to-date content delivery a smooth user experience throughout the application.",
      ],
    },
    {
      num: "04",
      title: "Front-End Developer",
      companyName: "CYBER RECONNAISSANCE & COMBAT",
      startDate: "August 2022",
      endDate: "December 2022",
      experiencePoints: [
        "Built a secure and user-friendly web application using Angular, with Angular Material and PrimeNG to speed up development and improve the UI.",
        "Improved user flows by adding authentication and responsive Ul components, making the app more secure and accessible.",
        "Boosted performance by using state management and optimizing component rendering for a smoother user experience.",
        "Implemented real-time data synchronization and caching strategies to enhance performance and reduce latency.",
        "Designed a modular architecture with lazy loading and code splitting to reduce initial load time and make the app easier to scale."
      ],
    },
  ],
};

