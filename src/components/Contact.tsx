import React, { useState } from "react";
import AppButton from "./AppButton";
import { AppIcon } from "./AppIcon";
import AppInput from "./AppInput";

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ fullName: "", email: "", message: "" });
  };

  return (
    <section
      id="contact"
      className="relative w-full py-24 sm:py-32 md:py-36 px-5 sm:px-8 md:px-12 bg-earth-black text-earth-cream overflow-hidden"
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-earth-moss/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-earth-sand/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto relative z-10">      

        {/* Two-Column Grid: Left (Empty for now) & Right (Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Column: Reserved / Empty for now */}
          <div
            className="w-full min-h-[220px] sm:min-h-[300px] lg:min-h-[520px] rounded-2xl sm:rounded-3xl border border-dashed border-earth-cream/10 bg-earth-card/20 flex items-center justify-center relative overflow-hidden"
            aria-label="Left section container"
          >
            {/* Kept clean and empty for upcoming visual/interactive content */}
          </div>

          {/* Right Column: Contact Form */}
          <div className="w-full">
            <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-earth-card border border-earth-cream/10 shadow-[0_-12px_32px_rgba(0,0,0,0.7),0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Subtle top golden accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-earth-sand/60 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {isSuccess ? (
                <div className="py-10 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-earth-sand/20 border border-earth-sand/40 flex items-center justify-center text-earth-sand shadow-lg shadow-earth-sand/20">
                    <AppIcon icon="check" className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-heading text-earth-cream tracking-tight">
                    Message Sent!
                  </h3>
                  <p className="text-earth-cream/70 text-sm sm:text-base max-w-md font-sans">
                    Thank you for reaching out. Your message has been received, and I'll get back to you as soon as possible.
                  </p>
                  <div className="pt-4">
                    <AppButton
                      variant="outline"
                      size="md"
                      onClick={() => setIsSuccess(false)}
                      className="!border-earth-sand/40 !text-earth-sand hover:!text-earth-cream hover:!border-earth-sand"
                    >
                      Send Another Message
                    </AppButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-earth-cream tracking-tight mb-1">
                      Send a Message
                    </h3>                    

                  {/* Full Name */}
                  <AppInput
                    id="fullName"
                    name="fullName"
                    label="Full Name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    disabled={isSubmitting}
                  />

                  {/* Email */}
                  <AppInput
                    type="email"
                    id="email"
                    name="email"
                    label="Email Address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. alex@example.com"
                    disabled={isSubmitting}
                  />

                  {/* Message */}
                  <AppInput
                    multiline
                    rows={5}
                    id="message"
                    name="message"
                    label="Message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project, opportunity, or inquiry..."
                    disabled={isSubmitting}
                  />

                  {/* Submit Button */}
                  <div className="pt-2">
                    <AppButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      icon={isSubmitting ? undefined : "arrow-right"}
                      iconPosition="right"
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? "Sending Message..." : "Send Message"}
                    </AppButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
