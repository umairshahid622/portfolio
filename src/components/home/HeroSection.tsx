import { user } from "../../utilities/user";
import { ScrollIcon } from "../icons/Icons";
import ZoopButton from "../ZoopButton";

const HeroSection = () => {
  return (
    <section>
      <div className="flex relative">
        <div className="space-y-6">
          <p className="text-brand-orange text-2xl tracking-widest uppercase">
            {user.firstName} {user.lastName}
          </p>
          <h1 className="uppercase">{user.profession}</h1>
          <p>{user.professionDescription}</p>
          <ZoopButton title="ContactMe" />
          <ScrollIcon className="text-dark-bg dark:text-brand-white size-12" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
