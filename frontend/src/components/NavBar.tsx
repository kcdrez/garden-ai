import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserIcon, SunIcon, MoonIcon, LogOutIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { auth } from "../auth/auth";

export default function NavBar() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const navigate = useNavigate();

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  function logout() {
    auth.clearTokens();
    navigate("/login");
  }

  return (
    <nav className="flex items-center px-4 py-2 border-b border-border">
      <div className="flex items-center gap-2 mr-auto">
        <Link to="/" className="font-bold text-foreground no-underline">
          Garden AI
        </Link>
        <Link to="/gardens" className={buttonVariants({ variant: "ghost" })}>
          View Gardens
        </Link>
      </div>

      <div className="flex items-center gap-2">

        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Account menu"
          >
            <UserIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleTheme}>
              {dark ? <SunIcon /> : <MoonIcon />}
              {dark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
