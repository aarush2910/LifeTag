import SignPage from "../components/sign-up"
import { motion } from "framer-motion"

const Signup = () => {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <SignPage/>
    </motion.div>
  )
}

export default Signup