import logo from "@/assets/tp-logo.svg";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import type { User } from "@/types/auth";
import {
  LayoutDashboard,
  LogOut,
  Route,
  Server,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authService
      .getProfile()
      .then(setUser)
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="h-full w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8 w-8" />
        <h1 className="text-xl font-bold">Traefik Panel</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Button
          asChild
          variant={pathname === "/dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname.startsWith("/routers") ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to="/routers">
            <Route className="mr-2 h-4 w-4" />
            Routers
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname.startsWith("/services") ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to="/services">
            <Server className="mr-2 h-4 w-4" />
            Services
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname === "/profile" ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to="/certificates-resolvers">
            <Shield className="mr-2 h-4 w-4" />
            Certificates Resolvers
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname === "/profile" ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </nav>
      <div className="p-4 border-t">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
