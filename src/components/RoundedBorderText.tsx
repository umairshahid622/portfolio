const RoundedBorderText = ({ text }: { text: String }) => {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-brand-primary dark:border-brand-primary/40 dark:bg-brand-primary/20">
      {text}
    </span>
  );
};

export default RoundedBorderText;
