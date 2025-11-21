// import { BarChart3, Calendar, Clock, GraduationCap, HelpCircle, Home, LineChart, TrendingUp } from "lucide-react";
import { BarChart3, Calendar, CalendarDays, Clipboard, ClipboardClock, Clock, Cross, Handshake, Home, HomeIcon, LineChart, MedalIcon, Rabbit } from "lucide-react";

export const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Add New Cattle",
      url: "/Add_new_cattle", 
      icon: Calendar,
    },
    {
      title: "View Cattle List",
      url: "/view_cattle_list",
      icon: BarChart3,
    },
     {
      title: "Appointment Request",
      url: "/appointment_info",
      icon: BarChart3,
    },
    {
      title: "Ownership Transfer",
      url: "/ownership_transfer",
      icon: Clock,
    },
    {
      title: "Retirement Request ",
      url: "/retirement_request",
      icon: LineChart,
    }

  ]

 export const vetMenu = [
    {
      title: "Appointment Management",
      url: "/vet_dashboard",
      icon: ClipboardClock,
    },
    {
      title: "Prescription / Health",
      url: "/vet_dashboard/health",
      icon: Cross,
    },
    {
      title: "Vaccination & Event",
      url: "/vet_dashboard/events",
      icon: CalendarDays,
    },


  ]

  export const shelterMenu=[
    {
      title: "Home",
      url: "/shelter_dashboard",
      icon: HomeIcon,
    },
    {
      title: "Intake Requests",
      url: "/shelter_dashboard/intake-requests",
      icon: Clipboard,
    },
    {
      title: "View Animals",
      url: "/shelter_dashboard/animals",
      icon: Rabbit,
    },
    {
      title: "Health Records",
      url: "/shelter_dashboard/health-record",
      icon: MedalIcon,
    },
    {
      title: "Adoptions ",
      url: "/shelter_dashboard/adoption",
      icon: Handshake,
    },
  ]