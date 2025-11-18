// import { BarChart3, Calendar, Clock, GraduationCap, HelpCircle, Home, LineChart, TrendingUp } from "lucide-react";
import { BarChart3, Calendar, CalendarDays, ClipboardClock, Clock, Cross, Home, LineChart, TrendingUp } from "lucide-react";

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