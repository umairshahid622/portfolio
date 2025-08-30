import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "../hooks/useTheme";
import type { ThemeItems } from "../types/theme.type";
import { MoonIcon, SunIcon } from "./icons/Icons";
import { AnimatePresence, motion, stagger, type Variants } from "motion/react";
import { itemVairants, panelVariants } from "../constants/themeToggleFramerVariants";

const ThemeToggler = () => {
  const { theme, resolved } = useTheme();

  const themeItems: ThemeItems[] = [
    { key: "light", title: "Light", icon: SunIcon },
    { key: "dark", title: "Dark", icon: MoonIcon },
    {
      key: "system",
      title: "System",
      icon: resolved === "dark" ? MoonIcon : SunIcon,
    },
  ];
  const active = themeItems.find((i) => i.key === theme) || themeItems[2];
  const ActiveIcon = active.icon;
  return (
    <DropDownLink items={themeItems} activeKey={active.key}>
      {
        <ActiveIcon
          className="
            text-brand-green
            size-5 dark:text-brand-white
          "
        />
      }
    </DropDownLink>
  );
};

const DropDownLink = ({
  children,
  items,
  activeKey,
}: {
  children: ReactNode;
  activeKey: string;
  items: ThemeItems[];
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const showContent: boolean = isOpen && items.length > 0;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    const handleClickOutSide = (event: MouseEvent) => {
      const node = panelRef.current;
      if (node && !node.contains(event.target as Node)) {
        setIsOpen(() => false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutSide);
    return () => document.removeEventListener("mousedown", handleClickOutSide);
  }, [isOpen]);


  return (
    <div
      ref={panelRef}
      className="
        relative
      "
    >
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        initial={{ rotate: -90 }}
        animate={{ rotate: 0 }}
        exit={{ rotate: 90 }}
        transition={{ duration: 0.18 }}
        key={activeKey}
        className="
          flex
          border-2 rounded-full border-brand-green
          size-8 items-center justify-center dark:border-brand-white
        "
      >
        {children}
      </motion.button>

      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="
              flex flex-col
              min-w-40
              px-2 py-2 space-y-1
              bg-light-bg
              border border-light-border rounded-lg
              shadow-xl
              absolute dark:border-dark-border dark:bg-dark-bg right-0 top-10 items-start
            "
          >
            {items.map(({ key, title }) => {
              const isActive = key === theme;
              return (
                <motion.button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setIsOpen(() => false);
                  }}
                  variants={itemVairants}
                  className={`
                    w-full
                    p-2
                    text-start text-sm
                    rounded-md
                    ${
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }
                  `}
                >
                  {title}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggler;
