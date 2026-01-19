import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import { vetMenu } from "../../menudata/SidebarMenuItem";
import Events from "./Vet/Events";
import { useNavigate, useParams } from "react-router-dom";
import VetHome from "./Vet/VetHome";
import Health from "./Vet/Health";
import { useEffect, useState } from "react";



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
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    if (!user) {
        return <div>Loading...</div>;
    }
  // const user = { user_name: "Uno", role: "Vet", user_id: "989832" };
      //   role: "vet",
      //   vet_id: data.vet_id ?? null,
      //   license_no: licenseNo.trim(),
      //   name: data.name ?? null,
      //   token: data.access_token ?? null,
      // };
      console.log(user)
    let ContentComponent: React.ComponentType;

    if (!nested) {
      ContentComponent = VetHome;
    } else if (nested === "health") {
      ContentComponent = Health;
    } else if (nested === "events") {
      ContentComponent = Events;
    } else {
      ContentComponent = () => <div>Page not found</div>;
    }
    return (
        <div className="w-full">
            <SidebarProvider>
                <AppSidebar items={vetMenu}/>
                <SidebarInset>
                    <header className="flex px-4 h-16 shrink-0 items-center gap-2 border-b">
                        <SidebarTrigger className="-ml-1" />
                        <div className="ml-auto pr-2 md:pr-0">
                            <div className="text-right">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Welcome, {user.name}!
                                </h2>
                                <p className="text-sm italic text-muted-foreground capitalize">
                                    {user.role} Dashboard
                                </p>
                            </div>
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