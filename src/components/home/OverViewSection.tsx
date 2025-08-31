import { user } from "../../data/user";

const OverViewSection = () => {
  return (
    <div className="border w-full space-y-6">
      <div>
        <p>Introduction</p>
        <h1>Overview.</h1>
        <p className="max-w-2xl">{user.professionDescription}</p>
      </div>
      <div>
        <h3 className="text-center">Technical Skills</h3>
      </div>
    </div>
  );
};

export default OverViewSection;
