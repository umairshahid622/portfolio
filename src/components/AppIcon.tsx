import React from "react";
import { Icons, type IconName } from "../assets/Icons";

export interface AppIconProps {
  icon: IconName | string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}

export function AppIcon({
  icon,
  className = "w-4 h-4",
  style,
  "aria-hidden": ariaHidden = true,
}: AppIconProps) {
  if (!icon) return null;

  // If a React Node / JSX element is passed
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className: `${(icon.props as { className?: string }).className || ""} ${className}`.trim(),
    });
  }

  // If icon is string (either IconName or SVG URL path)
  if (typeof icon === "string") {
    const iconUrl = (Icons as Record<string, string>)[icon] || icon;

    return (
      <span
        aria-hidden={ariaHidden}
        className={`inline-block shrink-0 bg-current align-middle ${className}`}
        style={{
          maskImage: `url("${iconUrl}")`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
          WebkitMaskImage: `url("${iconUrl}")`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          ...style,
        }}
      />
    );
  }

  return null;
}

export default AppIcon;
