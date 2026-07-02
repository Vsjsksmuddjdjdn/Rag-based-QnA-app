import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="icon-button"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
