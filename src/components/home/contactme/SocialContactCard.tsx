import { GmailIcon, WhattsappIcon } from "../../icons/Icons";

type SocialContactCardProps = {
  variant: "email" | "whatsapp";
  label: string;
  href: string;
  value: string;
};

const variantStyles = {
  email: {
    border: "border-[#EA4335]/40 hover:border-[#EA4335]",
    iconBg: "bg-[#EA4335]/15 text-[#EA4335] group-hover/link:bg-[#EA4335]/25",
  },
  whatsapp: {
    border: "border-[#25D366]/50 hover:border-[#25D366]",
    iconBg: "bg-[#25D366]/15 text-[#25D366] group-hover/link:bg-[#25D366]/25",
  },
};

const SocialContactCard = ({
  variant,
  label,
  href,
  value,
}: SocialContactCardProps) => {
  let Icon;
  let target;
  let rel;

  switch (variant) {
    case "email":
      Icon = GmailIcon;
      target = undefined;
      rel = undefined;
      break;

    case "whatsapp":
      Icon = WhattsappIcon;
      target = "_blank";
      rel = "noopener noreferrer";
      break;

    default:
      Icon = GmailIcon;
      target = undefined;
      rel = undefined;
      break;
  }

  const styles = variantStyles[variant];

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`group/link flex items-center gap-4 rounded-xl border-l-4 bg-light-card/70 py-3 pl-4 pr-4 transition-all hover:-translate-x-0.5 hover:bg-light-card dark:bg-dark-surface/70 dark:hover:bg-dark-surface ${styles.border}`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl  transition group-hover/link:scale-105 ${styles.iconBg}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className="block truncate text-sm font-medium">{value}</span>
      </div>
    </a>
  );
};

export default SocialContactCard;
