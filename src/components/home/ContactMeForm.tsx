import { useState } from "react";
import ZoopButton from "../ZoopButton";
import ColorShiftText from "../ColorShiftText";
// import { GitHubIcon, LinkedInIcon } from "../icons/Icons";
// import { useTheme } from "../../hooks/useTheme";

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

  // const { resolved } = useTheme();
  return (
    <div
      className="
    p-4 space-y-4
      rounded-lg border border-light-border
      dark:border-dark-border"
    >
      <form
        onSubmit={onFormSubmit}
        className="
      space-y-4
      "
      >
        <div>
          <p>Get in touch</p>
          <ColorShiftText title="Contact Me" to="var(--color-brand-orange)" />
        </div>
        <div
          className="
        space-y-4
        "
        >
          <input
            name="fullName"
            type="text"
            placeholder="Full Name"
            required
            value={formData.fullName}
            onChange={handleChange}
          />
          <input
            name="email"
            type="email"
            placeholder="Your Email"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
          ></textarea>
        </div>
        <ZoopButton
          type="submit"
          title="Send Message"
          className="
        w-full
        "
        />
      </form>
      {/* <p className="text-center">Or</p> */}
      {/* <div className="flex items-center justify-center gap-8">
        <a
          href="https://github.com/umairshahid622"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub profile"
        >
          <GitHubIcon
            className={`cursor-pointer size-6 ${resolved === "dark" ? "text-brand-white" : "text-brand-black"}`}
          />
        </a>
        <a
          href="https://www.linkedin.com/in/umair-shahid-b72086243/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
        >
          <LinkedInIcon className="cursor-pointer size-6 text-[#007aaa]" />
        </a>
      </div> */}
    </div>
  );
};

export default ContactMeForm;
