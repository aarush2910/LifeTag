import { useParams } from "react-router-dom";
import { AppSidebar } from "../../components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { shelterMenu } from "../../menudata/SidebarMenuItem";
import Home from "../../components/shelter/Home";
import IntakeRequests from "../../components/shelter/Intake";
import AnimalRegistry from "../../components/shelter/Animal";
import HealthRecords from "../../components/shelter/HealthRecord";
import AdoptionProcessing from "../../components/shelter/Adoption";


const Shelter_Dashboard = () => {
    const { nested } = useParams();
    const user = { user_name: "Gadriya", role: "Shelter", user_id: "989832" };
  
      let ContentComponent: React.ComponentType;
  
      if (!nested) {
        ContentComponent = Home;
    } else if(nested.trim() === ""){
          ContentComponent = Home;

      
      } else if (nested === "intake-requests") {
        ContentComponent = IntakeRequests;
      } else if (nested === "animals") {
        ContentComponent = AnimalRegistry;
      } else if (nested === "health-record") {
        ContentComponent = HealthRecords;
      } else if (nested === "adoption") {
        ContentComponent = AdoptionProcessing;
      } else {
        ContentComponent = () => <div>Page not found</div>;
      }
      return (
          <div className="w-full">
              <SidebarProvider>
                  <AppSidebar items={shelterMenu}/>
                  <SidebarInset>
                      <header className="flex px-4 h-16 shrink-0 items-center gap-2 border-b">
                          <SidebarTrigger className="-ml-1" />
                          <div className="ml-auto pr-2 md:pr-0">
                              <div className="text-right">
                                  <h2 className="text-lg font-semibold text-foreground">
                                      Welcome, {user.user_name}!
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

export default Shelter_Dashboard