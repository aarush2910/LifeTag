import ContactSection from "../components/contact"
import { motion } from "framer-motion"

const Contact = () => {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <ContactSection/>
    </motion.div>
  )
}

export default Contact