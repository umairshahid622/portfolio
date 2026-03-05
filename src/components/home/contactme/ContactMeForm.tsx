import { useState } from "react";
import ZoopButton from "../../ZoopButton";
import ColorShiftText from "../../ColorShiftText";

const ContactMeForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", formData);
  };

  return (
    <div className="group/card relative overflow-hidden rounded-2xl border border-light-border/60 bg-gradient-to-br from-light-bg/80 via-light-bg/40 to-light-bg/20 p-6 shadow-lg shadow-brand-primary/5 transition-shadow hover:shadow-brand-primary/10 dark:border-dark-border/60 dark:from-dark-bg/80 dark:via-dark-bg/40 dark:to-dark-bg/20 dark:shadow-brand-primary/10 dark:hover:shadow-brand-primary/20 lg:p-8">

      <form onSubmit={onFormSubmit} className="relative space-y-6">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-brand-primary dark:border-brand-primary/40 dark:bg-brand-primary/20">
            Get in touch
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <ColorShiftText  textSize="text-4xl" title="Contact Me" to="var(--color-brand-orange)" />
          </h2>
          
        </header>

        <div className="space-y-4">
            
            <input
              name="fullName"
              type="text"
              placeholder="Your name"
              required
              value={formData.fullName}
              onChange={handleChange}
              
            />
          <label className="block space-y-1.5">
            
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={formData.email}
              onChange={handleChange}
              
            />
          </label>
          <label className="block space-y-1.5">
            
            <textarea
              name="message"
              placeholder="What's on your mind?"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}              
            />
          </label>
        </div>

        <ZoopButton type="submit" title="Send Message" className="w-full" />
      </form>
    </div>
  );
};

export default ContactMeForm;
