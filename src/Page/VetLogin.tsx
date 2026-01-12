import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import Spinner from "../components/ui/spinner";

export default function VetLogin() {
  const [licenseNo, setLicenseNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!licenseNo.trim()) {
      alert("Please enter license number!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1) Check if vet has created a password already
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const checkRes = await fetch(
        `${API_BASE}/api/vet/vet/check-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license: licenseNo.trim() }),
      });


      if (!checkRes.ok) {
        // if check endpoint fails, show error
        const err = await checkRes.json().catch(() => null);
        throw new Error(err?.detail || "Failed to check license");
      }

      const checkData = await checkRes.json();
      if (checkData.has_password) {
        // redirect to create password page (pass license via state)
        setMessage("You don't have a password yet. Redirecting to create one...");
        // setTimeout(() => {
          // navigate("/vet/create-password", { state: { license_no: licenseNo } });
        // }, 900);
        console.log(checkData)
        return;
      }

      // 2) Perform login
      if (!password.trim()) {
        alert("Please enter your password!");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/vet/vet/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license: licenseNo.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Invalid credentials");

      // store user data / token (adjust to your backend response)
      const user = {
        role: "vet",
        vet_id: data.user_id ?? null,
        license_no: licenseNo.trim(),
        name: data.user_name ?? null,
        token: data.access_token ?? null,
      };
      localStorage.setItem("user", JSON.stringify(user));
      if (data.access_token) localStorage.setItem("token", data.access_token);

      setMessage("✅ Login successful! Redirecting...");
      navigate("/vet_dashboard", { replace: true });
      setTimeout(() => window.location.reload(), 150);
    } catch (error) {
      if (error instanceof Error) setMessage(`❌ ${error.message}`);
      else setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 z-[9999]"
    >
      <motion.form
        onSubmit={handleLogin}
        autoComplete="off"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
      >
        <motion.div className="bg-primary/80 p-8 text-primary-foreground text-center">
          <h1 className="text-2xl font-bold">Vet Login</h1>
          <p className="text-sm text-primary-foreground/80 mt-2">
            Login with your veterinary license number
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
            <Label htmlFor="password" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={18} />
                  Logging in...
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

        <div className="bg-zinc-50 dark:bg-zinc-900 border-t px-8 py-4 text-center text-sm">
          Don't have a password?
          <Link
            to="/vet/create-password"
            state={{ license_no: licenseNo }}
            className="ml-2 text-primary font-semibold underline"
          >
            Create Password
          </Link>
        </div>
      </motion.form>
    </motion.section>
  );
}
