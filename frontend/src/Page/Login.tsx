import LoginPage from "../components/login"
import { motion } from "framer-motion"

const Login = () => {
    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
        >
            <LoginPage />
        </motion.div>
    )
}

export default Login