
import ContactDetails from "./contactme/ContactDetails";
// import TelePhoneCanvas from "../canvas/TelePhoneCanvas";
import ContactMeForm from "./contactme/ContactMeForm";

const ContactMeSection = () => {
  return (
    <div
      aria-labelledby="contact-heading"
      className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2"
    >    
      <ContactDetails/>
      <ContactMeForm />
    </div>
  );
};

export default ContactMeSection;
