import arrowRight from "./arrow-right.svg";
import arrowUpRight from "./arrow-up-right.svg";
import download from "./download.svg";
import externalLink from "./external-link.svg";
import sun from "./sun.svg";
import moon from "./moon.svg";
import mail from "./mail.svg";
import phone from "./phone.svg";
import code from "./code.svg";
import sparkles from "./sparkles.svg";
import check from "./check.svg";
import eye from "./eye.svg";
import chevronDown from "./chevron-down.svg";
import github from "./github.svg";
import linkedin from "./linkedin.svg";

export const Icons = {
  "arrow-right": arrowRight,
  "arrowRight": arrowRight,
  "arrow-up-right": arrowUpRight,
  "arrowUpRight": arrowUpRight,
  "download": download,
  "external-link": externalLink,
  "externalLink": externalLink,
  "sun": sun,
  "moon": moon,
  "mail": mail,
  "phone": phone,
  "code": code,
  "sparkles": sparkles,
  "check": check,
  "eye": eye,
  "chevron-down": chevronDown,
  "chevronDown": chevronDown,
  "github": github,
  "linkedin": linkedin,
} as const;

export type IconName = keyof typeof Icons;

export {
  arrowRight,
  arrowUpRight,
  download,
  externalLink,
  sun,
  moon,
  mail,
  phone,
  code,
  sparkles,
  check,
  eye,
  chevronDown,
  github,
  linkedin,
};
