import { useState } from "react";
import ZoopButton from "../ZoopButton";
import ColorShiftText from "../ColorShiftText";

const ContactMeForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", formData);
  };
  return (
    <form
      onSubmit={onFormSubmit}
      className="
      p-4 space-y-4
      rounded-lg border border-light-border
      dark:border-dark-border
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
          placeholder="Email"
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
        title="Send"
        className="
        w-full
      "
      />
    </form>
  );
};

export default ContactMeForm;
