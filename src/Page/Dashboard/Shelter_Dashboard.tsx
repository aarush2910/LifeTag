import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import UserMenu from "../../components/user-menu";
import NotificationBell from "../../components/NotificationBell";
import { shelterMenu } from "../../menudata/SidebarMenuItem";
import Home from "../shelter/Home";
import IntakeRequests from "../shelter/Intake";
import AnimalRegistry from "../shelter/Animal";
import HealthRecords from "../shelter/HealthRecord";
import AdoptionProcessing from "../shelter/Adoption";
import ShelterAccountInfo from "../shelter/ShelterAccountInfo";
import ShelterSettings from "../shelter/ShelterSettings";

const Shelter_Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [greetIdx, setGreetIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const greetings = ["Welcome back", "Good to see you", "Hello there"];

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
    } else {
      const parsed = JSON.parse(userData);
      if (parsed.role?.toLowerCase() !== "shelter") {
        navigate("/shelter/login");
      } else {
        setUser(parsed);
      }
    }
  }, []);

  // Cycle greeting with fade animation every 5s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setGreetIdx(i => (i + 1) % greetings.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const path = location.pathname;
  let ContentComponent: React.ComponentType<any>;
  let contentProps: any = {};

  if (path === "/shelter-dashboard" || path === "/shelter-dashboard/") {
    ContentComponent = Home;
  } else if (path === "/shelter-dashboard/intake-requests") {
    ContentComponent = IntakeRequests;
  } else if (path === "/shelter-dashboard/animals") {
    ContentComponent = AnimalRegistry;
  } else if (path === "/shelter-dashboard/health-record") {
    ContentComponent = HealthRecords;
  } else if (path === "/shelter-dashboard/adoption") {
    ContentComponent = AdoptionProcessing;
  } else if (path === "/shelter-dashboard/account-info") {
    ContentComponent = ShelterAccountInfo;
    contentProps = { initialTab: "account" };
  } else if (path === "/shelter-dashboard/settings") {
    ContentComponent = ShelterAccountInfo;
    contentProps = { initialTab: "settings" };
  } else {
    ContentComponent = () => <div className="p-8 text-muted-foreground">Page not found</div>;
  }

  const displayName = user.sname || user.user_name || user.name || "Shelter";

  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={shelterMenu} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 px-2 md:px-4">
            <SidebarTrigger className="-ml-1" />

            {/* Animated welcome message — matches Farmer Dashboard style */}
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
                {displayName} 👋
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
          <main>
            <ContentComponent {...contentProps} />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default Shelter_Dashboard;