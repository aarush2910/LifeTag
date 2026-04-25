import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import { vetMenu } from "../../menudata/SidebarMenuItem";
import Events from "./Vet/Events";
import { useNavigate, useParams } from "react-router-dom";
import VetHome from "./Vet/VetHome";
import Health from "./Vet/Health";
import VetAccountInfo from "./Vet/VetAccountInfo";
import VetSettings from "./Vet/VetSettings";
import VetAvailability from "./Vet/VetAvailability";
import { useEffect, useState } from "react";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/user-menu";


export type UserType = {
  name: string;
  role: string;
  vet_id: string;
  license_no: string;
};

export default function Vet_Dashboard() {
    const navigate = useNavigate();
    const { nested } = useParams();
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/vet/login');
        } else {
            const parsed = JSON.parse(userData);
            if (parsed.role?.toLowerCase() !== "vet") {
                navigate('/vet/login');
            } else {
                setUser(parsed);
            }
        }
    }, []);

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen text-lg font-medium text-muted-foreground">Loading...</div>;
    }

    let ContentComponent: React.ComponentType<any>;

    if (!nested) {
      ContentComponent = VetHome;
    } else if (nested === "health") {
      ContentComponent = Health;
    } else if (nested === "events") {
      ContentComponent = Events;
    } else if (nested === "account-info") {
      ContentComponent = VetAccountInfo;
    } else if (nested === "settings") {
      ContentComponent = VetSettings;
    } else if (nested === "availability") {
      ContentComponent = VetAvailability;
    } else {
      ContentComponent = () => <div className="p-8 text-muted-foreground">Page not found</div>;
    }

    return (
        <div className="w-full">
            <SidebarProvider>
                <AppSidebar items={vetMenu}/>
                <SidebarInset>
                    <header className="flex px-2 md:px-4 h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
                        <SidebarTrigger className="-ml-1" />
                        <div className="ml-3 hidden sm:flex flex-col leading-tight">
                          <span className="text-xs text-muted-foreground">Welcome back,</span>
                          <span className="text-sm font-semibold text-foreground">{user.name} 👋</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <NotificationBell />
                            <UserMenu />
                        </div>
                    </header>
                     <main>
                        <ContentComponent/>
                     </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}