import { motion } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export default function CattleViewList() {
  const cattleData = [
    {
      image: "/Gir_Cow.jpeg",
      name: "Gauri",
      breed: "Gir Cow",
      dob: "12 Mar 2021",
      health: "Excellent 🟢",
      features: "High milk yield, disease-resistant, calm temperament.",
    },
    {
      image: "/Shahiwal_cow.jpg",
      name: "Suri",
      breed: "Sahiwal",
      dob: "25 Jul 2022",
      health: "Good 🟡",
      features: "Adaptable to hot climates, rich milk fat content.",
    },
    {
      image: "/Ongole_cow.jpg",
      name: "Pushpa",
      breed: "Ongole",
      dob: "09 Jan 2020",
      health: "Excellent 🟢",
      features: "Strong build, good reproductive efficiency.",
    },
    {
      image: "/Holestien_cow.jpg",
      name: "Meera",
      breed: "Holstein Friesian",
      dob: "30 May 2023",
      health: "Fair 🟠",
      features: "High milk production, requires proper nutrition and shade.",
    },
    {
      image: "/Tharparkar_Cow.jpg",
      name: "Ganga",
      breed: "Tharparkar",
      dob: "14 Oct 2021",
      health: "Excellent 🟢",
      features: "Resistant to heat and disease, high butterfat content.",
    },
    {
      image: "/Red_shindi_cow.jpg",
      name: "Rani",
      breed: "Red Sindhi",
      dob: "05 Jun 2020",
      health: "Good 🟡",
      features: "Long lifespan, regular calving, good milk yield.",
    },
  ];

  const cardVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10"
          >
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold ml-4">🐄 Cattle View List</h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          {/* Main Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-1 flex-col gap-4 p-6 pt-6 bg-gray-50 min-h-screen"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center"
            >
              {cattleData.map((cattle, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariant}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white">
                    
                    {/* 🐮 Focused Upper-Half / Face Image */}
                    <div className="w-full h-48 overflow-hidden bg-gray-100">
                      <img
                        src={cattle.image}
                        alt={cattle.name}
                        className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {cattle.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{cattle.breed}</p>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date of Birth:</span>{" "}
                        {cattle.dob}
                      </p>
                      <p>
                        <span className="font-medium">Health Condition:</span>{" "}
                        {cattle.health}
                      </p>
                      <p>
                        <span className="font-medium">Key Features:</span> <br />
                        {cattle.features}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
