import type { WorkExperience } from "../../../types/user.type";


const CarouselContent = ({ item }: { item: WorkExperience }) => {
  return (
    <div className="grid grid-cols-2 gap-4 items-center px-14">
      <div className="space-y-2">
        <h1 className="leading-none font-extrabold text-transparent text-outline">{item.num}</h1>
        <h5>{item.title}</h5>
        <h6>{item.companyName}</h6>
        <p>
          {item.startDate} - {item.endDate}
        </p>
      </div>
      <div className="py-4 px-8 rounded-lg relative overflow-hidden bg-light-card dark:bg-dark-card">
        <ul className="list-disc text-lg">
            {item.experiencePoints.map((point, index) => (
                <li key={index}>{point}</li>
            ))}
        </ul>
        <div className="h-1 w-full bg-brand-orange absolute bottom-0 left-0"></div>
      </div>
    </div>
  );
};

export default CarouselContent;
