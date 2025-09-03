import { useTheme } from "../../hooks/useTheme";
import type { SkillIcon } from "../../types/user.type";

interface Props {
  icons: SkillIcon[];
}

const TabItem = ({ icons }: Props) => {
  const { resolved } = useTheme();

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {icons.map((icon,index) => {
        return (
          <div 
          key={index}
          className="border-2 border-light-border dark:border-dark-border rounded-lg size-20 p-3">
            <img
              className="size-full"
              src={resolved === "dark" ? icon.darkIconPath : icon.iconPath}
              alt=""
            />
          </div>
        );
      })}
    </div>
  );
};

export default TabItem;
