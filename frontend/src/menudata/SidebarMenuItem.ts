import { BarChart3, Calendar, CalendarDays, Clipboard, ClipboardClock, Clock, Cross, FileText, Handshake, Home, HomeIcon, LineChart, MedalIcon, Rabbit } from "lucide-react";

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
      url: "/request_vet",
      icon: BarChart3,
    },
    {
      title: "Ownership Transfer",
      url: "/ownership_transfer",
      icon: Clock,
    },
    {
      title: "Retirement Request",
      url: "/dashboard/retirement",
      icon: LineChart,
    },
    {
      title: "Appointment History",
      url: "/dashboard/history",
      icon: Clock,
    },
    {
      title: "My Prescriptions",
      url: "/dashboard/prescriptions",
      icon: FileText,
    },
  ]

 export const vetMenu = [
    {
      title: "Appointment Management",
      url: "/vet-dashboard",
      icon: ClipboardClock,
    },
    {
      title: "Prescription / Health",
      url: "/vet-dashboard/health",
      icon: Cross,
    },
    {
      title: "Vaccination & Event",
      url: "/vet-dashboard/events",
      icon: CalendarDays,
    },
    {
      title: "Availability",
      url: "/vet-dashboard/availability",
      icon: Clock,
    },
  ]

  export const shelterMenu=[
    {
      title: "Home",
      url: "/shelter-dashboard",
      icon: HomeIcon,
    },
    {
      title: "Intake Requests",
      url: "/shelter-dashboard/intake-requests",
      icon: Clipboard,
    },
    {
      title: "View Animals",
      url: "/shelter-dashboard/animals",
      icon: Rabbit,
    },
    {
      title: "Health Records",
      url: "/shelter-dashboard/health-record",
      icon: MedalIcon,
    },
    {
      title: "Adoptions",
      url: "/shelter-dashboard/adoption",
      icon: Handshake,
    },
  ]