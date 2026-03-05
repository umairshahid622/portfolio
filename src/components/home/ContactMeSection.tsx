import { useTheme } from "../../hooks/useTheme";
import { GitHubIcon, GmailIcon, LinkedInIcon, WhattsappIcon } from "../icons/Icons";
// import TelePhoneCanvas from "../canvas/TelePhoneCanvas";
import ContactMeForm from "./ContactMeForm";

const ContactMeSection = () => {
  const { resolved } = useTheme();
  return (
    <>
      <div
        className="
          grid grid-cols-1
          w-full
          items-center
          gap-4
          lg:grid-cols-2
        "
      >
        <div>
          <h1>Contact Details</h1>
          <div className="flex items-center justify-start gap-4">
              <GmailIcon className="size-12"/>
              <p>shahidumair622@gmail.com</p>
          </div>
          <div className="flex items-center justify-start gap-4">
              <WhattsappIcon className="size-12 text-[#25D366]"/>
              <p>+92 321 5215701</p>
          </div>
          <div className="space-y-3">
            <h6>Follow me on</h6>
            <div className="flex items-center justify-start gap-8">
              <a
                href="https://github.com/umairshahid622"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="border border-light-border dark:border-dark-border rounded-lg size-14 p-3 flex items-center justify-center"
              >
                <GitHubIcon
                  className={`${resolved === "dark" ? "text-brand-white" : "text-brand-black"}`}
                />
              </a>
              <a
                href="https://www.linkedin.com/in/umair-shahid-b72086243/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="border border-light-border dark:border-dark-border rounded-lg size-14 p-3 flex items-center justify-center"
              >
                <LinkedInIcon className=" text-[#007aaa]" />
              </a>
            </div>
          </div>
        </div>
        {/* <div><TelePhoneCanvas /></div> */}
        <ContactMeForm />
      </div>
    </>
  );
};

export default ContactMeSection;
