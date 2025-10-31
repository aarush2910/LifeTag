
import ContentSection from "../components/content-3"
import Features from "../components/features-4"
import FooterSection from "../components/footer"
import { HeroHeader } from "../components/header"
import HeroSection from "../components/hero-section"
import StatsSection from "../components/stats-2"
import TeamSection from "../components/team"
import { motion } from "framer-motion"
const Home = () => {
    return (

        <motion.div
            className="w-full min-h-screen flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
        >
            <HeroHeader />
            <HeroSection />
            <ContentSection />
            <Features />
            <StatsSection />
            <TeamSection />
            <FooterSection />
        </motion.div>

    )
}

export default Home