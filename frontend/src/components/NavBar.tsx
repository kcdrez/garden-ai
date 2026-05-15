import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";

export default function NavBar() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <nav className="flex items-center px-4 py-2 border-b border-border">
      <Link to="/" className="font-bold mr-auto text-foreground no-underline">
        Garden AI
      </Link>

      <div className="flex items-center gap-2">
        <Link to="/gardens" className={buttonVariants({ variant: "ghost" })}>
          View Gardens
        </Link>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
          {dark ? "☀️" : "🌙"}
        </Button>
      </div>
    </nav>
  );
}
