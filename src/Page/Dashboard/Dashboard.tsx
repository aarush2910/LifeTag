import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";

type UserType = {
  user_name: string;
  role: string;
  user_id: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium text-gray-600">
        Loading...
      </div>
    );
  }

  const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const cardData = [
    {
      image: "/Livestock_Nutrition.png",
      title: "Livestock Nutrition",
      desc: "Provide a balanced diet rich in protein and minerals to boost milk and meat quality. Livestock nutrition involves providing animals with a balanced diet containing energy, protein, fats, vitamins, minerals, and water to support their growth, reproduction, and overall health.",
      tip: "💡 Always provide clean water and mineral blocks daily.",
    },
    {
      image: "/disease_prevention.jpg",
      title: "Disease Prevention",
      desc: "Regular vaccinations and clean shelters help prevent major infections in animals. Disease prevention in livestock involves a combination of biosecurity measures, proper nutrition and housing, regular veterinary care, and vaccination programs.",
      tip: "💡 Schedule a vet visit every 6 months.",
    },
    {
      image: "/breeding_care.jpg",
      title: "Breeding & Care",
      desc: "Healthy breeding practices improve livestock productivity and reduce health risks. Breeding and care of livestock involve managing domestic animals for human needs through scientific techniques for feeding, breeding, and health management.",
      tip: "💡 Always record breed data and calving history.",
    },
  ];

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
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          {/* Centered Cards Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-1 items-center justify-center p-6 bg-gray-50 min-h-[calc(100vh-4rem)]"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-6xl w-full justify-center"
            >
              {cardData.map((card, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariant}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-white shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                >
                  {/* Focused Upper Image */}
                  <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {card.desc}
                    </p>
                    <div className="mt-3 text-sm text-green-700 font-medium">
                      {card.tip}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
