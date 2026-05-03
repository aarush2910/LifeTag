import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../components/ui/spinner";

export default function ShelterLogin() {
  const [shelterId, setShelterId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shelterId.trim() || !password.trim()) {
      setMessage("❌ Please fill Shelter ID and password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/auth/shelter/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelter_id: shelterId.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid credentials");

      // Save minimal user info + token
      const user = {
        role: "shelter",
        shelter_id: shelterId.trim(),
        shelter_name: data.user_name ?? null,
        user_id: data.user_id ?? null,
        token: data.access_token ?? null,
        access_token: data.access_token ?? null,
      };
      localStorage.setItem("user", JSON.stringify(user));
      if (data.access_token) localStorage.setItem("token", data.access_token);

      setMessage("✅ Login successful — redirecting...");
      navigate("/shelter-dashboard", { replace: true });
      setTimeout(() => window.location.reload(), 120);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 z-[9999]"
    >
      <motion.form
        onSubmit={handleSubmit}
        autoComplete="off"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
      >
        <motion.div className="bg-primary/80 p-6 text-primary-foreground text-center">
          {/* example logo using uploaded file path */}
          {/* <img
            src=""
            alt="LifeTag"
            className="mx-auto h-10 w-auto mb-2 object-contain"
          /> */}
          <h1 className="text-2xl font-bold">Shelter Login</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Sign in with your Shelter ID
          </p>
        </motion.div>

        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="shelter_id" className="text-sm font-semibold">
              Shelter ID *
            </Label>
            <Input
              id="shelter_id"
              placeholder="Enter Shelter ID"
              value={shelterId}
              onChange={(e) => setShelterId(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Spinner size={16} /> Logging in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`text-center text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 border-t px-6 py-4 text-center text-sm">
          Don't have an account?
          <Link to="/shelter/signup" className="ml-2 text-primary font-semibold underline">
            Create Shelter Account
          </Link>
        </div>
      </motion.form>
    </motion.section>
  );
}
