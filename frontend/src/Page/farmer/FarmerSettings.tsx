import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import {
  User, Phone, Mail, MapPin, Tractor, Lock, Bell, ShieldAlert,
  Eye, EyeOff, Check, Save,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-muted/30">
        <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ type }: { type: "success" | "error" | "idle" }) {
  if (type === "idle") return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      {type === "success" ? "Changes saved successfully!" : "Something went wrong"}
    </div>
  );
}

// ─── Section: Personal Info ─────────────────────────────────────────────────
function PersonalInfoSection({ initialData, user }: { initialData: any; user: any }) {
  const [form, setForm] = useState({
    fname: initialData.fname || "",
    fphone: initialData.fphone || "",
    femail: initialData.femail || "",
    faddress: initialData.faddress || "",
    farmname: initialData.farmname || "",
    farmtype: initialData.farmtype || "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`${API_BASE}/api/auth/farmer-info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Personal Information" icon={User}>
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: "fname", label: "Full Name", type: "text", icon: User, placeholder: "Your full name" },
            { name: "fphone", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+91 XXXXX XXXXX" },
            { name: "femail", label: "Email Address", type: "email", icon: Mail, placeholder: "you@email.com" },
            { name: "farmname", label: "Farm Name", type: "text", icon: Tractor, placeholder: "e.g. Green Valley Farm" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} name={name} type={type} placeholder={placeholder}
                value={(form as any)[name]} onChange={handleChange} className="h-10" />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="faddress" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</Label>
          <Input id="faddress" name="faddress" type="text" placeholder="Village, District, State, PIN"
            value={form.faddress} onChange={handleChange} className="h-10" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="farmtype">Farm Type</Label>
          <select id="farmtype" name="farmtype" value={form.farmtype} onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select type...</option>
            <option value="Dairy">🐄 Dairy</option>
            <option value="Beef">🥩 Beef</option>
            <option value="Mixed">🌾 Mixed</option>
            <option value="Organic">🌿 Organic</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <StatusBadge type={status} />

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Password Field (module-level to avoid remount on every render) ──────────
function PasswordField({ name, label, form, show, handleChange, setShow }: {
  name: string;
  label: string;
  form: any;
  show: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShow: React.Dispatch<React.SetStateAction<{ current: boolean; newPass: boolean; confirm: boolean }>>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name} name={name}
          type={show[name] ? "text" : "password"}
          value={form[name]} onChange={handleChange}
          placeholder="••••••••" className="h-10 pr-10"
        />
        <button type="button" onClick={() => setShow(s => ({ ...s, [name]: !s[name as keyof typeof s] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Change Password ───────────────────────────────────────────────
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
    setError("");
    setSaving(true);
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
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed");
      }
      setStatus("success");
      setForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Change Password" icon={Lock}>
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <PasswordField name="current" label="Current Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="newPass" label="New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="confirm" label="Confirm New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <StatusBadge type={status} />
        <Button type="submit" variant="outline" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Section: Notifications ─────────────────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    vaccination_reminders: true,
    appointment_updates: true,
    health_alerts: true,
    shelter_updates: false,
  });

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !(p as any)[key] }));

  const items = [
    { key: "vaccination_reminders", label: "Vaccination Reminders", desc: "Get notified 3 days before scheduled vaccinations" },
    { key: "appointment_updates", label: "Appointment Updates", desc: "Vet appointment confirmations and rejections" },
    { key: "health_alerts", label: "Health Alerts", desc: "Disease warnings and health record updates" },
    { key: "shelter_updates", label: "Shelter Updates", desc: "Status updates on retirement/intake requests" },
  ];

  return (
    <SectionCard title="Notification Preferences" icon={Bell}>
      <div className="space-y-4">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                (prefs as any)[key] ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
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

// ─── Section: Danger Zone ───────────────────────────────────────────────────
function DangerZoneSection() {
  const [confirm, setConfirm] = useState(false);

  return (
    <SectionCard title="Danger Zone" icon={ShieldAlert}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently remove your account and all associated data. This cannot be undone.</p>
          </div>
          {!confirm ? (
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 shrink-0" onClick={() => setConfirm(true)}>
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Confirm Delete</Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Export My Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">Download a copy of your profile, cattle records, and health data.</p>
          </div>
          <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50 shrink-0">
            Export
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function FarmerSettings() {
  const user = getUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = user.access_token || user.token || "";
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProfile(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={36} /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and personal information</p>
      </div>
      {profile && <PersonalInfoSection initialData={profile} user={user} />}
      <ChangePasswordSection user={user} />
      <NotificationsSection />
      <DangerZoneSection />
    </div>
  );
}
