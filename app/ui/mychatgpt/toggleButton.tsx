import { Button } from "antd";
import type { ReactNode } from "react";
interface ToggleButtonProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  icon?: ReactNode;
  text?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export default function ToggleButton({
  collapsed,
  setCollapsed,
  icon,
  text,
  ariaLabel,
  className,
}: ToggleButtonProps) {
  const computedAriaLabel = ariaLabel ?? (collapsed ? "expand sidebar" : "collapse sidebar");

  return (
    <Button
      type="text"
      icon={icon ? icon : ""}
      onClick={() => setCollapsed((prev) => !prev)}
      className={className}
      aria-label={computedAriaLabel}
    >
      {text}
    </Button>
  );
}
