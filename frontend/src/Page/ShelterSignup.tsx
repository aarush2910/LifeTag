import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../components/ui/spinner";

export default function ShelterSignup() {
  const [shelterName, setShelterName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // basic validation
    if (!shelterName.trim() || !contact.trim() || !email.trim() || !password.trim()) {
      setMessage("❌ Please fill required fields (name, contact, email, password).");
      return;
    }
    if (password !== confirm) {
      setMessage("❌ Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        sname: shelterName.trim(),
        sphone: contact.trim(),
        semail: email.trim(),
        saddress: address.trim() || "-",
        scapacity: typeof capacity === "number" ? capacity : 0,
        password,
      };

      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/auth/shelter/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      setMessage("✅ Shelter registered successfully! Redirecting to login...");
      window.alert("Account created successfully. Please check your email for your generated Shelter ID.");
      // clear minimal fields
      setShelterName("");
      setContact("");
      setEmail("");
      setAddress("");
      setCapacity("");
      setPassword("");
      setConfirm("");

      setTimeout(() => navigate("/shelter/login"), 1200);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : String(err)}`);
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
        className="bg-card w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden"
      >
        <motion.div className="bg-primary/80 p-6 text-primary-foreground text-center">
          {/* <img src="/mnt/data/Screenshot 2025-11-21 114020.png" alt="LifeTag" className="mx-auto h-10 w-auto mb-2 object-contain" /> */}
          <h1 className="text-2xl font-bold">Shelter Sign Up</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">Create shelter account to receive retired cattle</p>
        </motion.div>

        <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shelter_name" className="text-sm font-semibold">Shelter Name *</Label>
            <Input id="shelter_name" placeholder="Shelter / Gaushala name" value={shelterName} onChange={(e) => setShelterName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Shelter ID</Label>
            <Input value="Auto-generated and sent via email after signup" disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm font-semibold">Contact (mobile) *</Label>
            <Input id="contact" placeholder="Phone number" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
            <Input id="email" type="email" placeholder="Shelter email address (required)" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
            <Input id="address" placeholder="Town / district / short address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-sm font-semibold">Capacity (optional)</Label>
            <Input id="capacity" type="number" placeholder="e.g., 50" value={capacity === "" ? "" : String(capacity)} onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
            <Input id="password" type="password" placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-semibold">Confirm Password *</Label>
            <Input id="confirm" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
        </div>

        <div className="p-6">
          <div>
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? (
                <span className="flex items-center gap-2 justify-center"><Spinner size={16} /> Creating...</span>
              ) : (
                "Create Shelter Account"
              )}
            </Button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`text-center text-sm mt-3 ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center text-sm">
            Already registered?
            <Link to="/shelter/login" className="ml-2 text-primary font-semibold underline">Login</Link>
          </div>
        </div>
      </motion.form>
    </motion.section>
  );
}
