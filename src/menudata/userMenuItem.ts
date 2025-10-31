import { LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const nav=useNavigate()
export const userMenuItems = [
    {
      title: "Account Info",
      icon: User,
      onClick: () => nav("/account-info")
    },
    {
      title: "Settings", 
      icon: Settings,
      onClick: () => console.log("Settings clicked")
    },
    {
      title: "Logout",
      icon: LogOut,
      onClick: () => nav("Home/")
    }
  ]