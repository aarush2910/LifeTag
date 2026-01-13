// src/Page/Auth/LoginPage.tsx
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Spinner from "../components/ui/spinner";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { SelectNative } from "../components/ui/select-native";
import { useState } from "react";

/**
 * LoginPage
 *
 * - Sends credentials to POST /api/auth/login
 * - On success: stores access_token, role, user_id (and aliases), identifier keys
 * - These localStorage keys are later consumed by src/lib/api.ts (apiFetch)
 *   to populate Authorization and x-owner-id / x-inaph-id headers automatically.
 */

export default function LoginPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [faadhar, setFaadhar] = useState("");
  const [vemail, setVemail] = useState("");
  const [semail, setSemail] = useState("");
  const [password, setPassword] = useState("");

  // API base (optional env)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Aadhaar validation for farmer
    if (role === "farmer") {
      const cleanAadhar = faadhar.replace(/\s/g, "");
      if (!/^\d{12}$/.test(cleanAadhar)) {
        setError("Please enter a valid 12-digit Aadhaar number");
        setLoading(false);
        return;
      }
    }

    // Build identifier
    let identifier = "";
    if (role === "farmer") identifier = faadhar.replace(/\s/g, "");
    else if (role === "vet") identifier = vemail.trim();
    else if (role === "shelter") identifier = semail.trim();

    const requestData = {
      role,
      password,
      identifier,
    };

    try {
      // NOTE: We use direct fetch for login (no token yet). Later API calls should use src/lib/api.ts apiFetch.
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Login response status:", res.status, "body:", data);

      if (!res.ok) {
        // backend sometimes returns detail or message
        setError(data.detail || data.message || data.error || "Invalid Credentials");
        setLoading(false);
        return;
      }

      // Successful login — store token + user info
      try {
        // 1) Token (JWT) — store under both keys for compatibility
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("token", data.access_token);
        }

        // 2) Store full response for convenience (may include extra fields)
        localStorage.setItem("user", JSON.stringify(data));

        // 3) Role — important so apiFetch can attach role-aware headers
        const resolvedRole = (data.role || role || "farmer").toString().toLowerCase();
        localStorage.setItem("role", resolvedRole);

        // 4) user_id (primary id from backend)
        // Backend returns user_id (string) in Token response -> save it
        if (data.user_id) {
          localStorage.setItem("user_id", data.user_id);
          // keep backward compatibility aliases
          if (resolvedRole === "farmer") localStorage.setItem("farmerId", data.user_id);
          if (resolvedRole === "vet") localStorage.setItem("vet_id", data.user_id);
          if (resolvedRole === "shelter") localStorage.setItem("shelter_id", data.user_id);
        }

        // 5) Some backends may include inaph_id in login response — store it if present
        if ((data as any).inaph_id) {
          localStorage.setItem("inaph_id", (data as any).inaph_id);
        }

        // 6) Display name & role (optional)
        if (data.user_name) localStorage.setItem("user_name", data.user_name);

        // 7) Save identifier key (so FarmerAccountInfo can find it)
        // Prefer Aadhaar (if farmer)
        if (resolvedRole === "farmer") {
          if (identifier) {
            localStorage.setItem("identifier", identifier);
            localStorage.setItem("faadhar", identifier);
          }
        } else if (resolvedRole === "vet") {
          if (identifier) {
            localStorage.setItem("identifier", identifier);
            localStorage.setItem("vemail", identifier);
          }
        } else if (resolvedRole === "shelter") {
          if (identifier) {
            localStorage.setItem("identifier", identifier);
            localStorage.setItem("semail", identifier);
          }
        }
      } catch (saveErr) {
        console.warn("Warning saving login info to localStorage:", saveErr);
      }

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
      // slight delay to allow storing before reload (optional)
    } catch (err) {
      console.error("Network/login error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginField = () => {
    if (role === "farmer") {
      return (
        <div className="space-y-2">
          <Label htmlFor="faadhar" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Aadhaar Number *
          </Label>
          <Input
            type="text"
            required
            id="faadhar"
            autoComplete="off"
            className="h-11"
            placeholder="XXXX XXXX XXXX"
            value={faadhar}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "").slice(0, 12);
              v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
              setFaadhar(v);
            }}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your 12-digit Aadhaar number</p>
        </div>
      );
    } else if (role === "vet") {
      return (
        <div className="space-y-2">
          <Label htmlFor="vemail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email Address *
          </Label>
          <Input type="email" required id="vemail" autoComplete="off" className="h-11" placeholder="you@clinic.com" value={vemail} onChange={(e) => setVemail(e.target.value)} />
        </div>
      );
    } else if (role === "shelter") {
      return (
        <div className="space-y-2">
          <Label htmlFor="semail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email Address *
          </Label>
          <Input type="email" required id="semail" autoComplete="off" className="h-11" placeholder="shelter@example.com" value={semail} onChange={(e) => setSemail(e.target.value)} />
        </div>
      );
    }
  };

  return (
    <section className="flex min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-16 md:py-24 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <form onSubmit={handleSubmit} autoComplete="off" className="bg-card m-auto h-fit w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary/80 p-8 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">Sign in to access your LifeTag account</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Select Your Role *
              </Label>
              <SelectNative id="role" className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 h-11 text-base" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="farmer">🧑‍🌾 Farmer</option>
                <option value="vet">🩺 Veterinarian</option>
                <option value="shelter">🏠 Shelter</option>
              </SelectNative>
            </div>

            {/* Dynamic Login Field */}
            {renderLoginField()}

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Password *
                </Label>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary hover:text-primary/80">
                  <Link to="/forget">Forgot Password?</Link>
                </Button>
              </div>
              <Input type="password" required id="pwd" autoComplete="new-password" className="h-11" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Signing in...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-800 px-8 py-4">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Don't have an account?
            <Button asChild variant="link" className="px-2 text-primary hover:text-primary/80 font-semibold">
              <Link to="/signup">Create Account</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
