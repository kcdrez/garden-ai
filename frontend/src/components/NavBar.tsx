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
import { auth } from "@/auth/auth";
import { routes } from "@/lib/routes";
import { useTheme } from "@/hooks/useTheme";

export default function NavBar() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function logout() {
    auth.clearTokens();
    navigate(routes.login());
  }

  return (
    <nav className="flex items-center px-4 py-2 border-b border-border">
      <div className="flex items-center gap-2 mr-auto">
        <Link to={routes.home()} className="font-bold text-foreground no-underline">
          Garden AI
        </Link>
        <Link to={routes.gardens()} className={buttonVariants({ variant: "ghost" })}>
          Gardens
        </Link>
        <Link to={routes.allBeds()} className={buttonVariants({ variant: "ghost" })}>
          Beds
        </Link>
        <Link to={routes.allPlants()} className={buttonVariants({ variant: "ghost" })}>
          Plants
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
              {isDark ? <SunIcon /> : <MoonIcon />}
              {isDark ? "Light mode" : "Dark mode"}
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
