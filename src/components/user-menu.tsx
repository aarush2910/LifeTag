import {
  PinIcon,
  LogOutIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Spinner from "../components/ui/spinner";

export default function UserMenu() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ Load and parse user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        console.error("Invalid user data in localStorage");
      }
    }
  }, []);

  // ✅ Logout handler (same as sidebar behavior)
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("user");
    localStorage.clear();

    setTimeout(() => {
      nav("/");
      setIsLoggingOut(false);
    }, 800);
  };

  // ✅ Safely access name/email from multiple possible backend fields
  const displayName =
    user?.user_name || user?.name || user?.full_name || "User";
  const displayEmail =
    user?.email || user?.user_email || user?.username || "user@gmail.com";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar>
            <AvatarImage src="/origin/avatar.jpg" alt="Profile image" />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-64" align="end">
        {/* ✅ User Info Section */}
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            Hello, {displayName}!
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {displayEmail}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* ✅ Home */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => nav("/")}>
            <PinIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Home</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ✅ Account Info */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => nav("/account-info")}>
            <PinIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Account Info</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ✅ Logout (with spinner) */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 hover:bg-red-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <Spinner size={16} />
                <span className="ml-2 text-sm">Logging out...</span>
              </>
            ) : (
              <>
                <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
                <span>Logout</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
