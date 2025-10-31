import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../components/ui/spinner";

export default function InaphPage() {
  const [inaphId, setInaphId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inaphId.trim() || !password.trim()) {
      alert("Please fill in both INAPH ID and password!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/inaph/create-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inaph_id: inaphId,
          new_password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setMessage("✅ Password created successfully! Redirecting to login...");
      setInaphId("");
      setPassword("");

      setTimeout(() => {
        navigate("/InaphLogin");
      }, 1500);
    } catch (error) {
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
      <motion.form
        onSubmit={handleSubmit}
        autoComplete="off"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
      >
        {/* Header Section (kept same theme) */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/80 p-8 text-primary-foreground text-center"
        >
          <h1 className="text-2xl font-bold">INAPH Account Setup</h1>
          <p className="text-sm text-primary-foreground/80 mt-2">
            Create a password for your INAPH account
          </p>
        </motion.div>

        {/* Form */}
        <div className="p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label
              htmlFor="inaph_id"
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
            >
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <Label
              htmlFor="new_password"
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Create Password *
            </Label>
            <Input
              type="password"
              id="new_password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Creating...</span>
                </span>
              ) : (
                "Create Password"
              )}
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
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-800 px-8 py-4"
        >
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have a password?
            <Button
              asChild
              variant="link"
              className="px-2 text-primary hover:text-primary/80 font-semibold"
            >
              <Link to="/InaphLogin">Login here</Link>
            </Button>
          </p>
        </motion.div>
      </motion.form>
    </motion.section>
  );
}
