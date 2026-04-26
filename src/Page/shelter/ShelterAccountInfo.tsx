import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import {
  Building2, Phone, MapPin, ShieldCheck, Users,
  Lock, Bell, ShieldAlert, Eye, EyeOff, Check, Save,
  TrendingUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function SectionCard({ title, icon: Icon, children, accent = "blue" }: {
  title: string; icon: any; children: React.ReactNode; accent?: string;
}) {
  const accents: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ type, successMsg = "Changes saved!" }: { type: "success" | "error" | "idle"; successMsg?: string }) {
  if (type === "idle") return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      {type === "success" ? successMsg : "Something went wrong. Please try again."}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold">{value ?? <span className="italic text-muted-foreground font-normal">Not set</span>}</span>
    </div>
  );
}

function PasswordField({ name, label, form, show, handleChange, setShow }: any) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input id={name} name={name} type={show[name] ? "text" : "password"}
          value={form[name]} onChange={handleChange} placeholder="••••••••" className="h-10 pr-10" />
        <button type="button"
          onClick={() => setShow((s: any) => ({ ...s, [name]: !s[name] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Shelter Profile Info (read-only view) ───────────────────────────
function ProfileOverview({ profile }: { profile: any }) {
  const initials = profile?.sname?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "SH";
  return (
    <SectionCard title="Shelter Overview" icon={Building2} accent="blue">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate">{profile?.sname || "—"}</h3>
          <p className="text-sm text-muted-foreground">{profile?.semail || "—"}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              <ShieldCheck className="w-3 h-3" /> Verified Shelter
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
              <Users className="w-3 h-3" /> Capacity: {profile?.scapacity ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InfoField label="Registration No." value={profile?.sregistration} />
        <InfoField label="Phone" value={profile?.sphone} />
        <InfoField label="Address" value={profile?.saddress} />
        <InfoField label="Max Capacity" value={profile?.scapacity} />
        <InfoField label="Member Since" value={
          profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : undefined
        } />
      </div>
    </SectionCard>
  );
}

// ─── Section: Edit Profile ────────────────────────────────────────────────────
function EditProfileSection({ profile, user }: { profile: any; user: any }) {
  const [form, setForm] = useState({
    sname: profile?.sname || "",
    sphone: profile?.sphone || "",
    saddress: profile?.saddress || "",
    scapacity: profile?.scapacity?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setStatus("idle");
    try {
      const res = await fetch(`${API_BASE}/api/shelter/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
        body: JSON.stringify({
          sname: form.sname,
          sphone: form.sphone,
          saddress: form.saddress,
          scapacity: form.scapacity ? parseInt(form.scapacity) : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 4000); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Edit Profile" icon={Building2} accent="green">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: "sname", label: "Shelter Name", type: "text", icon: Building2, placeholder: "Official shelter name" },
            { name: "sphone", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+91 XXXXX XXXXX" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} name={name} type={type} placeholder={placeholder}
                value={(form as any)[name]} onChange={handleChange} className="h-10" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saddress" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Address
          </Label>
          <Input id="saddress" name="saddress" type="text" placeholder="Full shelter address"
            value={form.saddress} onChange={handleChange} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scapacity" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Animal Capacity
          </Label>
          <Input id="scapacity" name="scapacity" type="number" min="1" placeholder="Maximum animals"
            value={form.scapacity} onChange={handleChange} className="h-10 max-w-[160px]" />
        </div>
        <StatusBadge type={status} successMsg="Profile updated successfully!" />
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Section: Change Password ─────────────────────────────────────────────────
function ChangePasswordSection({ user }: { user: any }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPass !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.newPass.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
        body: JSON.stringify({ current_password: form.current, new_password: form.newPass }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed"); }
      setStatus("success");
      setForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setError(err.message); setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } finally { setSaving(false); }
  };

  return (
    <SectionCard title="Change Password" icon={Lock} accent="orange">
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <PasswordField name="current" label="Current Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="newPass" label="New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="confirm" label="Confirm New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <StatusBadge type={status} successMsg="Password updated successfully!" />
        <Button type="submit" variant="outline" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Section: Notification Preferences ───────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    intake_requests: true,
    intake_approved: true,
    adoption_requests: true,
    health_alerts: true,
    system_updates: false,
  });
  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !(p as any)[key] }));
  const items = [
    { key: "intake_requests", label: "New Intake Requests", desc: "Notified when a farmer submits a new retirement request" },
    { key: "intake_approved", label: "Request Decisions", desc: "Confirmations when you approve or reject intake requests" },
    { key: "adoption_requests", label: "Adoption Requests", desc: "Alerts when someone requests to adopt an animal" },
    { key: "health_alerts", label: "Health Record Alerts", desc: "Critical health updates and vaccination reminders" },
    { key: "system_updates", label: "System Updates", desc: "Platform news and feature announcements" },
  ];

  return (
    <SectionCard title="Notification Preferences" icon={Bell} accent="purple">
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${
                (prefs as any)[key] ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                (prefs as any)[key] ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteAccountModal({ onClose, onConfirm, deleting }: {
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === "DELETE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white shrink-0" />
          <h2 className="text-white font-bold text-lg">Delete Shelter Account</h2>
        </div>

        {/* Warning body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">⚠️ This action is permanent and cannot be undone.</p>
            <p className="text-sm text-red-700/80 dark:text-red-400/80">Deleting your account will permanently erase:</p>
            <ul className="text-sm text-red-700/80 dark:text-red-400/80 space-y-1 list-none">
              {[
                "Your shelter profile and all settings",
                "All intake requests (pending, approved, rejected)",
                "All animal health records created by your shelter",
                "All notifications associated with this account",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={!confirmed || deleting}
          >
            {deleting ? (
              <span className="flex items-center gap-2"><Spinner size={14} /> Deleting...</span>
            ) : (
              "Permanently Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Danger Zone ─────────────────────────────────────────────────────
function DangerZoneSection({ user }: { user: any }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/shelter/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to delete account");
      }
      // Clear session and redirect to home
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      {showModal && (
        <DeleteAccountModal
          onClose={() => setShowModal(false)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
      <SectionCard title="Danger Zone" icon={ShieldAlert} accent="red">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Shelter Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently remove your shelter, animals, intake requests, and all associated data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              onClick={() => { setError(""); setShowModal(true); }}
            >
              Delete Account
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Export Shelter Data</p>
              <p className="text-xs text-muted-foreground mt-0.5">Download a full report of your shelter profile, animals, and intake records.</p>
            </div>
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50 shrink-0">Export</Button>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ─── Main: Combined Account Info + Settings ───────────────────────────────────
export default function ShelterAccountSettings() {
  const user = getUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Derive active tab from URL — updates whenever the URL changes
  const activeTab: "account" | "settings" = location.pathname.includes("settings") ? "settings" : "account";

  useEffect(() => {
    const fetchProfile = async () => {
      // If no user_id, shelter is not logged in — don't make an API call
      if (!user.user_id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/shelter/me`, {
          headers: {
            Authorization: `Bearer ${user.access_token || user.token || ""}`,
            "x-user-id": user.user_id || "",
          },
        });
        const data = await res.json();
        if (res.ok) setProfile(data);
        else console.error("Shelter profile fetch failed:", data.detail);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={36} /></div>;

  // Not logged in — guide user to login
  if (!user.user_id) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      <Building2 className="w-12 h-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Session expired or not logged in</h2>
      <p className="text-sm text-muted-foreground max-w-xs">Please log in with your Shelter ID to view account information.</p>
      <a href="/shelter/login" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Go to Login</a>
    </div>
  );

  const tabs = [
    { id: "account", label: "Account Info", icon: Building2 },
    { id: "settings", label: "Settings", icon: Lock },
  ] as const;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Shelter Account</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage your shelter profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => navigate(
            id === "settings" ? "/shelter-dashboard/settings" : "/shelter-dashboard/account-info"
          )}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "account" && (
        <div className="space-y-5">
          {profile && <ProfileOverview profile={profile} />}
          {/* Quick stats */}
          <SectionCard title="Shelter Stats" icon={TrendingUp} accent="blue">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Animals in Care", value: profile?.total_animals ?? "—", color: "text-blue-600" },
                { label: "Max Capacity", value: profile?.scapacity ?? "—", color: "text-green-600" },
                { label: "Registration", value: profile?.sregistration ?? "—", color: "text-purple-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border bg-muted/20 p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-5">
          {profile && <EditProfileSection profile={profile} user={user} />}
          <ChangePasswordSection user={user} />
          <NotificationsSection />
          <DangerZoneSection user={user} />
        </div>
      )}
    </div>
  );
}
