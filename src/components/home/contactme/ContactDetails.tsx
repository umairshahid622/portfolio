import { user } from "../../../data/user";
import { useTheme } from "../../../hooks/useTheme";
import ColorShiftText from "../../ColorShiftText";
import { GitHubIcon, LinkedInIcon } from "../../icons/Icons";
import SocialContactCard from "./SocialContactCard";

const ContactDetails = () => {
    const { resolved } = useTheme();
  return (
    <div className="group/card relative overflow-hidden rounded-2xl border border-light-border/60 bg-gradient-to-br from-light-bg/80 via-light-bg/40 to-light-bg/20 p-6 shadow-lg shadow-brand-primary/5 transition-shadow hover:shadow-brand-primary/10 dark:border-dark-border/60 dark:from-dark-bg/80 dark:via-dark-bg/40 dark:to-dark-bg/20 dark:shadow-brand-primary/10 dark:hover:shadow-brand-primary/20 lg:p-8">
      <header className="relative space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-brand-primary dark:border-brand-primary/40 dark:bg-brand-primary/20">
          Let&apos;s collaborate
        </span>
        <ColorShiftText textSize="text-4xl" title="Contact Details" />
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Whether you have an opportunity, a question, or just want to say
          hi—reach out through any channel below.
        </p>
        <div className="h-px w-16 rounded-full bg-gradient-to-r from-brand-primary to-transparent" />
      </header>

      <div className="relative space-y-3">
        <SocialContactCard
          variant="email"
          label="Email"
          href={`mailto:${user.email}`}
          value={`${user.email}`}
        />
        <SocialContactCard
          variant="whatsapp"
          label="WhatsApp"
          href={`https://wa.me/${user.phone.replaceAll(" ", '')}`}
          value={`+${user.phone}`}
        />
      </div>

      <div className="relative space-y-4 pt-6 dark:border-dark-border/50">
        <h6 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Follow me
        </h6>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/umairshahid622"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="group/icon flex size-12 items-center justify-center rounded-xl border border-light-border/70 bg-light-surface/70 transition-all hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-primary/10 hover:shadow-lg hover:shadow-brand-primary/20 dark:border-dark-border/70 dark:bg-dark-surface/70 dark:hover:bg-dark-surface"
          >
            <GitHubIcon
              className={`size-6 transition  ${
                resolved === "dark" ? "text-brand-white" : "text-brand-black"
              }`}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/umair-shahid-b72086243/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="group/icon text-[#0A66C2] flex size-12 items-center justify-center rounded-xl border border-light-border/70 bg-light-surface/70 transition-all hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-primary/10 hover:shadow-lg hover:shadow-brand-primary/20 dark:border-dark-border/70 dark:bg-dark-surface/70 dark:hover:bg-dark-surface"
          >
            <LinkedInIcon className="size-6 transition " />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactDetails;
