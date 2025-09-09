import ContactMeForm from "./ContactMeForm";

const ContactMeSection = () => {
  return (
    <>
      <div
        className="
          grid grid-cols-1
          w-full
          gap-4
          lg:grid-cols-2
        "
      >
        <div></div>
        <ContactMeForm />
      </div>
    </>
  );
};

export default ContactMeSection;
