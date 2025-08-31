// HeroSection.tsx
import { user } from "../../data/user";
import ComputerCanvas from "../canvas/Computer";
import { ScrollIcon } from "../icons/Icons";
import ZoopButton from "../ZoopButton";

const HeroSection = () => {
  return (
    <>
      <div className="space-y-4 relative z-10">
        <p className="text-2xl text-brand-orange tracking-widest uppercase">{user.firstName + " " + user.lastName}</p>
        <h1>{user.profession}</h1>
        <ZoopButton title="Contact Me"/>
      </div>
      <ComputerCanvas />
    </>
  );
};

export default HeroSection;
