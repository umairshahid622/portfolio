import type { WorkExperience } from "../../../types/user.type";

const CarouselContent = ({
  item,
  num,
}: {
  item: WorkExperience;
  num: number;
}) => {
  return (
    <div className="grid grid-cols-1 items-center gap-6 px-2 sm:px-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Role #{num.toString().padStart(2, "0")}
        </p>
        <h2 className="text-2xl font-semibold lg:text-3xl">{item.title}</h2>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-brand-primary">{item.companyName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {item.startDate} — {item.endDate}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-light-border/60 bg-light-card/90 p-6 shadow-md shadow-brand-primary/5 dark:border-dark-border/60 dark:bg-dark-card/90">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-secondary/10 blur-2xl" />

        <ul className="space-y-2 text-sm leading-relaxed">
          {item.experiencePoints.map((point, index) => (
            <li key={index} className="relative pl-5">
              <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-brand-primary" />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-4 h-[2px] w-24 rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-transparent" />
      </div>
    </div>
  );
};

export default CarouselContent;
