import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Spinner from "../components/ui/spinner";

export default function VetCreatePassword() {
  const [licenseNo, setLicenseNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // If license_no passed via navigation state (from login), prefill it
  useEffect(() => {
    // @ts-ignore
    const state = location.state || {};
    if (state.license_no) setLicenseNo(state.license_no);
  }, [location.state]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!licenseNo.trim() || !password.trim()) {
      alert("Please fill license number and new password!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/vet/create-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license: licenseNo.trim(), new_password: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not create password");

      setMessage("✅ Password created successfully! Redirecting to login...");
      setLicenseNo("");
      setPassword("");
      setTimeout(() => navigate("/vet/login"), 1200);
    } catch (error) {
      if (error instanceof Error) setMessage(`❌ ${error.message}`);
      else setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 z-[9999]">
      <motion.form
        onSubmit={handleSubmit}
        autoComplete="off"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
      >
        <motion.div className="bg-primary/80 p-8 text-primary-foreground text-center">
          <h1 className="text-2xl font-bold">Create Vet Password</h1>
          <p className="text-sm text-primary-foreground/80 mt-2">
            Create a password for your vet account (license number)
          </p>
        </motion.div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="license_no" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              License Number *
            </Label>
            <Input
              id="license_no"
              placeholder="Enter license number"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              New Password *
            </Label>
            <Input
              id="new_password"
              type="password"
              placeholder="Create new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={18} />
                  Creating...
                </span>
              ) : (
                "Create Password "
              )}
            </Button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`text-center text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 border-t px-8 py-4 text-center text-sm">
          Already created a password?
          <Link to="/vet/login" className="ml-2 text-primary font-semibold underline">
            Login here
          </Link>
        </div>
      </motion.form>
    </motion.section>
  );
}
