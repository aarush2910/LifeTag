import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";
import NotificationBell from "../../components/NotificationBell";
import { items } from "../../menudata/SidebarMenuItem";
import FarmerAccountInfo from "../farmer/FarmerAccountInfo";
import FarmerSettings from "../farmer/FarmerSettings";
import RetirementForm from "../farmer/RetirementForm";
import FarmerPrescriptions from "../farmer/FarmerPrescriptions";
import AppointmentHistory from "../farmer/AppointmentHistory";

// ─── Home page content ────────────────────────────────────────────────────────
const cardData = [
  {
    image: "/Livestock_Nutrition.png",
    title: "Livestock Nutrition",
    desc: "Provide a balanced diet rich in protein and minerals to boost milk and meat quality.",
    tip: "💡 Always provide clean water and mineral blocks daily.",
  },
  {
    image: "/disease_prevention.jpg",
    title: "Disease Prevention",
    desc: "Regular vaccinations and clean shelters help prevent major infections in animals.",
    tip: "💡 Schedule a vet visit every 6 months.",
  },
  {
    image: "/breeding_care.jpg",
    title: "Breeding & Care",
    desc: "Healthy breeding practices improve livestock productivity and reduce health risks.",
    tip: "💡 Always record breed data and calving history.",
  },
];

function FarmerHome() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 bg-background min-h-[calc(100vh-4rem)]">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-6xl w-full">
        {cardData.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl bg-card shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-border"
          >
            <div className="w-full h-48 overflow-hidden bg-muted">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
              <div className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium">{card.tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [greetIdx, setGreetIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const greetings = ["Welcome back", "Good to see you", "Hello there"];

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { navigate("/login", { replace: true }); return; }
    try {
      const u = JSON.parse(raw);
      if (u?.role?.toLowerCase() !== "farmer") { navigate("/login", { replace: true }); return; }
      setUserName(u.user_name || "Farmer");
    } catch { navigate("/login", { replace: true }); return; }
    setReady(true);
  }, []);

  // Cycle greeting with fade animation every 5s
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setGreetIdx(i => (i + 1) % greetings.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium text-muted-foreground">
        Loading...
      </div>
    );
  }

  const path = location.pathname;

  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 px-2 md:px-4">
            <SidebarTrigger className="-ml-1" />

            {/* Animated welcome */}
            <div className="ml-3 hidden sm:flex flex-col leading-tight">
              <span
                className="text-xs text-muted-foreground transition-all duration-300"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)" }}
              >
                {greetings[greetIdx]},
              </span>
              <span
                className="text-sm font-semibold text-foreground transition-all duration-300"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(4px)" }}
              >
                {userName} 👋
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {path === "/dashboard/account-info" && <FarmerAccountInfo />}
          {path === "/dashboard/settings" && <FarmerSettings />}
          {path === "/dashboard/history" && <AppointmentHistory />}
          {path === "/dashboard/retirement" && <RetirementForm />}
          {path === "/dashboard/prescriptions" && <FarmerPrescriptions />}
          {![
            "/dashboard/account-info",
            "/dashboard/settings",
            "/dashboard/history",
            "/dashboard/retirement",
            "/dashboard/prescriptions",
          ].includes(path) && <FarmerHome />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
