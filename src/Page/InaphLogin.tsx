import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export default function InaphLogin() {
  const [inaphId, setInaphId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!inaphId.trim()) {
      alert("Please enter your INAPH ID!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Step 1: Check INAPH ID existence
      const checkRes = await fetch(
        `http://127.0.0.1:8000/api/auth/inaph/check-password?inaph_id=${inaphId}`
      );

      if (!checkRes.ok) throw new Error("INAPH ID not found!");
      const checkData = await checkRes.json();

      // If password not created
      if (!checkData.has_password) {
        alert("You haven’t created a password yet. Redirecting...");
        navigate("/InaphPage", { state: { inaph_id: inaphId } });
        return;
      }

      // Step 2: Perform login
      if (!password.trim()) {
        alert("Please enter your password!");
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/auth/inaph/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inaph_id: inaphId,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Invalid credentials");

      // Step 3: Store user info in localStorage
      const userData = {
        role: data.role || "farmer",
        aadhar: data.faadhar,
        password: password,
        user_id: data.user_id,
        user_name: data.user_name,
      };
      localStorage.setItem("user", JSON.stringify(userData));

      // Step 4: Redirect
      setMessage("✅ Login successful! Redirecting...");
      navigate("/dashboard", { replace: true });
      setTimeout(() => window.location.reload(), 150);

    } catch (error) {
      console.error("Login error:", error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 
        flex items-center justify-center 
        bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 
        dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 
        z-[9999]
      "
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
      >
        {/* Header (kept same theme) */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/80 p-8 text-primary-foreground text-center"
        >
          <h1 className="text-2xl font-bold">INAPH Login</h1>
          <p className="text-sm text-primary-foreground/80 mt-2">
            Access your LifeTag farmer account
          </p>
        </motion.div>

        {/* Form Section */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 space-y-6"
        >
          {/* INAPH ID */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <Label htmlFor="inaph_id" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              INAPH ID *
            </Label>
            <Input
              type="text"
              id="inaph_id"
              placeholder="Enter your INAPH ID"
              value={inaphId}
              onChange={(e) => setInaphId(e.target.value)}
              className="h-11"
              required
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <Label htmlFor="password" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Password *
            </Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </motion.div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </motion.div>

          {/* Animated Message */}
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`text-center text-sm mt-3 ${
                  message.startsWith("✅") ? "text-green-600" : "text-red-500"
                }`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>
      </motion.div>
    </motion.section>
  );
}
