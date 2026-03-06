import { user } from "../../data/user";
import ColorShiftText from "../ColorShiftText";
import CarouselSlider from "./carousel/CarouselSlider";

const ExperienceSection = () => {
    return ( 
        <div>
            <p>What i have done so far</p>
            <ColorShiftText title="Work Experience" />
            <CarouselSlider items={user.workExperience} />
        </div>
     );
}
 
export default ExperienceSection;